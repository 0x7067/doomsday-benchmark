import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { listFiles } from '../fs-walk.ts'
import { BENCH_ROOT, TEMPLATE_DIR } from '../paths.ts'
import { hashFile, type ShippedFiles } from './shipped-build.ts'

export interface ToolRun {
  ok: boolean
  /** Combined stdout and stderr, trimmed for the report. */
  log: string
}

export interface LintDiagnostic {
  file: string
  line: number | null
  rule: string
  severity: string
  message: string
}

export interface DeadCodeIssue {
  /** Knip's category: files, exports, types, dependencies, ... */
  category: string
  file: string
  name: string
}

export interface CodeFinding {
  file: string
  line: number
  text: string
}

export interface StaticReport {
  /** The app's own `npm run build`, which the brief requires to pass. */
  build: ToolRun
  /** The app's own `npm run lint`, which the brief requires to pass. */
  ownLint: ToolRun
  typecheck: ToolRun & { errorCount: number }
  /** oxlint with the scaffold's original config, so the agent can't grade itself by editing it. */
  lint: ToolRun & { diagnostics: LintDiagnostic[] }
  deadCode: ToolRun & { issues: DeadCodeIssue[] }
  suppressions: CodeFinding[]
  debugLogging: CodeFinding[]
  weakenedCompilerOptions: string[]
  untouchedScaffold: string[]
  /** False when app/src is exactly the scaffold's, i.e. nothing was built. */
  scaffoldReplaced: boolean
  /** Non-code files in src/ or public/ that neither ship nor are referenced (scaffold leftovers excluded). */
  orphanFiles: string[]
  strayFiles: string[]
  notes: string[]
}

const LOG_LIMIT = 6_000

/** TypeScript 6 turns these on by default, so explicitly disabling any of them weakens the checker. */
const STRICT_BY_DEFAULT = [
  'strict',
  'noImplicitAny',
  'strictNullChecks',
  'strictFunctionTypes',
  'strictBindCallApply',
  'strictPropertyInitialization',
  'noImplicitThis',
  'useUnknownInCatchVariables',
  'alwaysStrict',
]
/** Opt-in checks the scaffold enables; turning them off weakens the checker. */
const SCAFFOLD_CHECKS = ['noUnusedLocals', 'noUnusedParameters', 'noFallthroughCasesInSwitch', 'erasableSyntaxOnly']

/** Scaffold files that can reasonably survive a finished project unchanged. */
const SCAFFOLD_FILES_THAT_MAY_STAY = new Set([
  '.gitignore',
  '.oxlintrc.json',
  'package.json',
  'tsconfig.json',
  'tsconfig.app.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'src/main.tsx',
])

const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/
const SUPPRESSION = /(?:eslint|oxlint)-disable|@ts-(?:ignore|expect-error|nocheck)|\bas any\b|:\s*any\b|<any>/
const DEBUG_LOGGING = /\bconsole\.(?:log|debug|info|trace)\s*\(/
const MEDIA_OR_LOG = /\.(?:png|jpe?g|gif|webp|avif|webm|mp4|mov|log)$/i
/** Scratch words as whole name parts, so `TemplateCard.tsx` or `useDebugPanel.ts` don't match. */
const SCRATCH_NAME = /(?:^|[-_.])(?:screenshots?|scratch|debug|tmp|temp)(?:[-_.\d]|$)|\.(?:orig|bak)$/i
/** Files browsers or hosts look for by convention, so nothing needs to reference them. */
const CONVENTIONAL_PUBLIC_FILE = /^public\/(?:robots\.txt|favicon\.ico|apple-touch-icon[\w-]*\.png|site\.webmanifest|manifest\.json|sitemap\.xml)$/
const TEXT_FILE = /\.(?:[cm]?[jt]sx?|css|scss|html|svg|json|webmanifest)$/

export interface StaticContext {
  shipped: ShippedFiles
  /** Hashes of the scenario's assets: copies kept as source masters aren't stray. */
  providedAssets: Set<string>
}

export function runStaticChecks(appDir: string, context: StaticContext): StaticReport {
  const notes: string[] = []
  if (context.shipped.error) notes.push(`${context.shipped.error}; unreferenced files were judged by name only`)

  const build = npm(appDir, 'build')
  if (!build.ok) {
    // Still produce a bundle when only the type-check step failed, so the experience can be graded.
    const bundle = runTool(appBin(appDir, 'vite'), ['build'], appDir)
    notes.push(bundle.ok ? '`npm run build` failed; built with `vite build` alone to grade the experience' : '`vite build` also failed')
  }

  const typecheck = runTool(appBin(appDir, 'tsc'), ['-b'], appDir)
  const files = listFiles(appDir, ['dist'])
  const sourceFiles = files.filter((file) => file.startsWith('src/') && SOURCE_FILE.test(file))
  const scaffoldLeftovers = untouchedScaffold(appDir)

  return {
    build,
    ownLint: npm(appDir, 'lint'),
    typecheck: { ...typecheck, errorCount: typecheck.log.match(/error TS\d+/g)?.length ?? 0 },
    lint: canonicalLint(appDir, notes),
    deadCode: deadCode(appDir, notes),
    suppressions: findLines(appDir, sourceFiles, SUPPRESSION),
    debugLogging: findLines(appDir, sourceFiles, DEBUG_LOGGING),
    weakenedCompilerOptions: weakenedCompilerOptions(appDir, notes),
    untouchedScaffold: scaffoldLeftovers,
    scaffoldReplaced: scaffoldReplaced(appDir),
    orphanFiles: orphanFiles(appDir, files, context.shipped).filter((file) => !scaffoldLeftovers.includes(file)),
    strayFiles: strayFiles(appDir, files, context.providedAssets),
    notes,
  }
}

function runTool(command: string, args: string[], cwd: string): ToolRun & { stdout: string } {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  const log = `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? String(result.error) : ''}`.trim()
  return { ok: result.status === 0, log: log.length > LOG_LIMIT ? `${log.slice(0, LOG_LIMIT)}\n…` : log, stdout: result.stdout ?? '' }
}

function npm(appDir: string, script: string): ToolRun {
  const { ok, log } = runTool('npm', ['run', script], appDir)
  return { ok, log }
}

function appBin(appDir: string, name: string): string {
  return path.join(appDir, 'node_modules', '.bin', name)
}

function benchBin(name: string): string {
  return path.join(BENCH_ROOT, 'node_modules', '.bin', name)
}

function canonicalLint(appDir: string, notes: string[]): StaticReport['lint'] {
  const config = path.join(TEMPLATE_DIR, '.oxlintrc.json')
  const { log, stdout } = runTool(benchBin('oxlint'), ['-c', config, '--format', 'json', '--ignore-pattern', 'dist/**', '.'], appDir)
  try {
    const parsed = JSON.parse(stdout) as {
      diagnostics: { filename: string; code: string; severity: string; message: string; labels?: { span: { line: number } }[] }[]
    }
    const diagnostics = parsed.diagnostics.map((d) => ({
      file: d.filename,
      line: d.labels?.[0]?.span.line ?? null,
      rule: d.code,
      severity: d.severity,
      message: d.message,
    }))
    return { ok: !diagnostics.some((d) => d.severity === 'error'), log: '', diagnostics }
  } catch {
    notes.push('Could not parse oxlint output, so lint was not scored')
    return { ok: false, log, diagnostics: [] }
  }
}

function deadCode(appDir: string, notes: string[]): StaticReport['deadCode'] {
  // The grader's config only relaxes one rule: an export used in its own file isn't dead.
  const config = path.join(import.meta.dirname, 'knip.grader.json')
  const { log, stdout } = runTool(benchBin('knip'), ['--directory', appDir, '--config', config, '--reporter', 'json', '--no-progress'], appDir)
  try {
    const parsed = JSON.parse(stdout.slice(stdout.indexOf('{'))) as { issues: Record<string, unknown>[] }
    // Knip reports one entry per file with an array per category; flatten the non-empty ones.
    const issues = parsed.issues.flatMap((entry) =>
      Object.entries(entry)
        .filter((pair): pair is [string, { name: string }[]] => Array.isArray(pair[1]) && pair[1].length > 0)
        .flatMap(([category, items]) => items.map((item) => ({ category, file: String(entry.file), name: item.name }))),
    )
    return { ok: issues.length === 0, log: '', issues }
  } catch {
    notes.push('Could not parse knip output, so dead code was not scored')
    return { ok: false, log, issues: [] }
  }
}

function findLines(appDir: string, files: string[], pattern: RegExp): CodeFinding[] {
  return files.flatMap((file) =>
    fs
      .readFileSync(path.join(appDir, file), 'utf8')
      .split('\n')
      .flatMap((text, index) => (pattern.test(text) ? [{ file, line: index + 1, text: text.trim().slice(0, 160) }] : [])),
  )
}

function weakenedCompilerOptions(appDir: string, notes: string[]): string[] {
  const resolved = (project: string) => {
    const { ok, stdout } = runTool(appBin(appDir, 'tsc'), ['--showConfig', '-p', project], appDir)
    return ok ? ((JSON.parse(stdout) as { compilerOptions: Record<string, unknown> }).compilerOptions ?? {}) : null
  }
  const scaffold = resolved(path.join(TEMPLATE_DIR, 'tsconfig.app.json'))
  const app = resolved(path.join(appDir, 'tsconfig.app.json'))
  if (!scaffold || !app) {
    notes.push('Could not resolve tsconfig.app.json; compiler strictness was not compared')
    return []
  }
  return [
    ...STRICT_BY_DEFAULT.filter((flag) => app[flag] === false).map((flag) => `${flag} disabled`),
    ...SCAFFOLD_CHECKS.filter((flag) => scaffold[flag] === true && app[flag] !== true).map((flag) => `${flag} removed`),
  ]
}

/**
 * Knip only follows JS and TS imports, so an unimported stylesheet, image or
 * font slips past it. A file under src/ is in use when the build ships it byte
 * for byte; bundled files like CSS and JSON, and everything in public/ (which
 * always ships), count as in use when their name appears in index.html or in a
 * text file under src/ or public/.
 */
function orphanFiles(appDir: string, files: string[], shipped: ShippedFiles): string[] {
  const inApp = files.filter((file) => /^(?:src|public)\//.test(file))
  const corpus = [...inApp.filter((file) => TEXT_FILE.test(file)), 'index.html']
    .filter((file) => fs.existsSync(path.join(appDir, file)))
    .map((file) => ({ file, text: fs.readFileSync(path.join(appDir, file), 'utf8') }))
  return inApp.filter((file) => {
    if (SOURCE_FILE.test(file) || CONVENTIONAL_PUBLIC_FILE.test(file)) return false
    if (file.startsWith('src/') && shipped.hashes.has(hashFile(path.join(appDir, file)))) return false
    const name = path.basename(file)
    return !corpus.some((other) => other.file !== file && other.text.includes(name))
  })
}

/** Scratch-named files anywhere, and media or logs outside src/ and public/ unless they're copies of provided assets. */
function strayFiles(appDir: string, files: string[], providedAssets: Set<string>): string[] {
  return files.filter((file) => {
    if (SCRATCH_NAME.test(path.basename(file))) return true
    if (!MEDIA_OR_LOG.test(file) || /^(?:src|public)\//.test(file)) return false
    return !providedAssets.has(hashFile(path.join(appDir, file)))
  })
}

function scaffoldReplaced(appDir: string): boolean {
  const scaffold = listFiles(path.join(TEMPLATE_DIR, 'src'))
  const app = listFiles(path.join(appDir, 'src'))
  if (scaffold.join('\n') !== app.join('\n')) return true
  return scaffold.some(
    (file) => !fs.readFileSync(path.join(appDir, 'src', file)).equals(fs.readFileSync(path.join(TEMPLATE_DIR, 'src', file))),
  )
}

function untouchedScaffold(appDir: string): string[] {
  const untouched = listFiles(TEMPLATE_DIR).filter((file) => {
    if (SCAFFOLD_FILES_THAT_MAY_STAY.has(file)) return false
    const copy = path.join(appDir, file)
    return fs.existsSync(copy) && fs.readFileSync(copy).equals(fs.readFileSync(path.join(TEMPLATE_DIR, file)))
  })
  const indexHtml = path.join(appDir, 'index.html')
  if (!untouched.includes('index.html') && fs.existsSync(indexHtml) && /<title>\s*app\s*<\/title>/.test(fs.readFileSync(indexHtml, 'utf8'))) {
    untouched.push('index.html <title> is still "app"')
  }
  return untouched
}
