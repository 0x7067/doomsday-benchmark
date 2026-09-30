import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Marked } from 'marked'
import sharp from 'sharp'
import { listFiles } from '../fs-walk.ts'
import { detectHarness, type ImageWindow } from '../harness.ts'
import { BENCH_ROOT, RUNS_DIR, runPaths, type RunPaths } from '../paths.ts'
import { readMeta } from '../run-meta.ts'
import type { RunDuration, RunUsage } from '../usage.ts'

/*
 * Builds the static results site: the viewer page from viewer/, plus for each
 * graded run its app (rebuilt to work from a subfolder), compressed grader
 * captures, the report as HTML, and a summary in runs.json. Runs come from
 * this machine's runs/ and from results archived in the repository.
 * Transcripts are never published.
 */

export const SITE_DIR = path.join(BENCH_ROOT, '_site')
const VIEWER_DIR = path.join(BENCH_ROOT, 'viewer')
/** Archived results, committed as results/<batch>/<run>/ in the same layout as a graded run. */
const RESULTS_DIR = path.join(BENCH_ROOT, 'results')

/** One entry of runs.json, everything the viewer shows before opening the full report. */
export interface SiteRun {
  id: string
  /** The run's folder name before it was archived, which was its id while it was published from runs/. */
  formerId: string | null
  /** Runs are only ranked against runs of the same benchmark version, like "1" or "1.1". */
  benchmarkVersion: string
  scenario: { id: string; title: string; target: string; targetLabel: string }
  model: string
  variant: string | null
  harness: string | null
  gradedAt: string
  judgeModel: string | null
  score: { total: number; max: number; lines: { area: string; kind: string; points: number; max: number }[] }
  duration: RunDuration | null
  usage: Pick<RunUsage, 'turns' | 'tokens' | 'costUsd' | 'costBasis'> | null
  exit: { code: number | null; timedOut: boolean } | null
  imageWindow: ImageWindow | null
  /** False when the app couldn't be rebuilt for the site. */
  hasApp: boolean
}

/** The parts of report/score.json the site needs. */
interface GradedRun {
  /** Missing from reports graded before versions were recorded, which are all V1; a number in the first V1 reports. */
  benchmarkVersion?: string | number
  gradedAt: string
  judgeModel: string | null
  card: SiteRun['score']
  processFacts: { duration: RunDuration | null; usage: RunUsage | null }
}

/**
 * @param basePath The URL path the site is served from, like `/doomsday-benchmark/`
 *   on GitHub Pages. Each app is built for its exact location under it.
 */
export async function buildSite(basePath: string, outDir = SITE_DIR): Promise<SiteRun[]> {
  fs.rmSync(outDir, { recursive: true, force: true })
  fs.cpSync(VIEWER_DIR, outDir, { recursive: true })
  // Without this, GitHub Pages runs Jekyll and hides files starting with "_".
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '')

  const runs: SiteRun[] = []
  for (const { id, dir } of gradedRuns()) {
    console.log(`  ${id}`)
    const paths = runPaths(dir)
    const target = path.join(outDir, 'runs', id)
    const hasApp = buildApp(paths, path.join(target, 'app'), `${basePath}runs/${id}/app/`)
    await compressCaptures(paths, path.join(target, 'captures'))
    fs.writeFileSync(path.join(target, 'report.html'), renderReport(paths, id))
    runs.push({ ...summarize(paths, id), hasApp })
  }
  runs.sort((a, b) => b.score.total - a.score.total)
  fs.writeFileSync(path.join(outDir, 'runs.json'), `${JSON.stringify({ generatedAt: new Date().toISOString(), runs }, null, 2)}\n`)
  return runs
}

/** Every graded run, with the id it gets on the site. Archived runs are prefixed with their batch. */
function gradedRuns(): { id: string; dir: string }[] {
  const local = subfolders(RUNS_DIR).map((name) => ({ id: name, dir: path.join(RUNS_DIR, name) }))
  const archived = subfolders(RESULTS_DIR).flatMap((batch) =>
    subfolders(path.join(RESULTS_DIR, batch)).map((name) => ({ id: `${batch}_${name}`, dir: path.join(RESULTS_DIR, batch, name) })),
  )
  return [...local, ...archived]
    .filter((run) => fs.existsSync(path.join(run.dir, 'report', 'score.json')))
    .sort((a, b) => a.id.localeCompare(b.id))
}

function subfolders(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
}

/** Rebuilds the app to be served from `base` instead of a domain root. */
function buildApp(paths: RunPaths, outDir: string, base: string): boolean {
  if (!fs.existsSync(path.join(paths.app, 'node_modules'))) {
    execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: paths.app, stdio: 'ignore' })
  }
  const vite = path.join(paths.app, 'node_modules', '.bin', 'vite')
  const build = spawnSync(vite, ['build', '--base', base, '--outDir', outDir, '--emptyOutDir'], { cwd: paths.app, encoding: 'utf8' })
  if (build.status !== 0) {
    console.warn(`    could not build the app, so the site shows no live page:\n${build.stderr.slice(0, 1_000)}`)
    return false
  }
  rebasePublicPaths(outDir, path.join(paths.app, 'public'), base)
  return true
}

/**
 * Vite applies `--base` to the URLs it processes, but not to root paths
 * written as strings in the app's code, like `'/media/logo.png'`. Those work
 * at a domain root and break under a subpath, so point every root path that
 * names one of the app's own public files or folders at `base`.
 */
function rebasePublicPaths(outDir: string, publicDir: string, base: string): void {
  if (!fs.existsSync(publicDir)) return
  const names = fs.readdirSync(publicDir).map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (names.length === 0) return
  // A quote, `(`, `,` or whitespace before the path covers strings, url(), and srcset candidates.
  const rootPath = new RegExp(`(["'\`(,\\s])/(${names.join('|')})(?=[/"'\`)?#\\s,]|$)`, 'g')
  for (const file of listFiles(outDir).filter((name) => /\.(?:js|css|html)$/.test(name))) {
    const full = path.join(outDir, file)
    const content = fs.readFileSync(full, 'utf8')
    const rebased = content.replace(rootPath, (_, before: string, name: string) => `${before}${base}${name}`)
    if (rebased !== content) fs.writeFileSync(full, rebased)
  }
}

/** Grader captures as WebP. Archived results already ship them compressed, so those are copied. */
async function compressCaptures(paths: RunPaths, outDir: string): Promise<void> {
  const captures = path.join(paths.report, 'captures')
  fs.mkdirSync(outDir, { recursive: true })
  for (const file of listFiles(captures)) {
    const source = path.join(captures, file)
    if (file.endsWith('.png')) await sharp(source).webp({ quality: 80 }).toFile(path.join(outDir, file.replace(/\.png$/, '.webp')))
    else if (file.endsWith('.webp')) fs.copyFileSync(source, path.join(outDir, file))
  }
}

function renderReport(paths: RunPaths, id: string): string {
  const markdown = new Marked({
    // The page injects this HTML from the site root, so point capture links at the compressed copies there.
    walkTokens(token) {
      if (token.type === 'link' && token.href.startsWith('captures/')) {
        token.href = `runs/${id}/${token.href.replace(/\.png$/, '.webp')}`
      }
    },
    // Judges quote agent-written text such as `<time>`; it must never become markup.
    renderer: { html: ({ text }) => escapeHtml(text) },
  })
  const html = markdown.parse(fs.readFileSync(path.join(paths.report, 'REPORT.md'), 'utf8'), { async: false })
  // Keep this machine's paths out of a public page.
  return html.replaceAll(`${BENCH_ROOT}${path.sep}`, '').replaceAll(os.homedir(), '~')
}

function summarize(paths: RunPaths, id: string): Omit<SiteRun, 'hasApp'> {
  const meta = readMeta(paths)
  const provenance = path.join(paths.root, 'provenance.json')
  const originalName = fs.existsSync(provenance) ? (JSON.parse(fs.readFileSync(provenance, 'utf8')) as { run?: string }).run : undefined
  const graded = JSON.parse(fs.readFileSync(path.join(paths.report, 'score.json'), 'utf8')) as GradedRun
  const { usage, duration } = graded.processFacts
  const command = meta.agent?.command ?? ''
  const flag = (name: string) => new RegExp(`--${name}[ =]["']?([^\\s"']+)`).exec(command)?.[1] ?? null
  return {
    id,
    formerId: originalName && originalName !== id ? originalName : null,
    benchmarkVersion: String(graded.benchmarkVersion ?? 1),
    scenario: { id: meta.scenario.id, title: meta.scenario.title, target: meta.scenario.target, targetLabel: meta.scenario.targetLabel },
    model: usage?.model ?? flag('model') ?? meta.agent?.model ?? 'unknown model',
    variant: flag('variant') ?? flag('effort'),
    harness: meta.harness ?? (meta.agent ? detectHarness(command) : null),
    gradedAt: graded.gradedAt,
    judgeModel: graded.judgeModel,
    score: { total: graded.card.total, max: graded.card.max, lines: graded.card.lines.map(({ area, kind, points, max }) => ({ area, kind, points, max })) },
    duration,
    usage: usage && { turns: usage.turns, tokens: usage.tokens, costUsd: usage.costUsd, costBasis: usage.costBasis },
    exit: meta.agent ? { code: meta.agent.exitCode, timedOut: meta.agent.timedOut } : null,
    imageWindow: meta.imageWindow ?? null,
  }
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]!)
}
