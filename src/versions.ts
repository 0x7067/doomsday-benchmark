import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { BENCH_ROOT, RUNS_DIR } from './paths.ts'
import { BENCHMARK_VERSION } from './version.ts'

/*
 * Commands run under the latest version unless `--version` asks for an
 * earlier one. Every released version is a git tag (v1, v1.1, …), so an
 * earlier version runs its own code exactly as it was: the tag is checked out
 * once into .versions/, and its CLI runs there, sharing this checkout's runs/.
 */

const VERSIONS_DIR = path.join(BENCH_ROOT, '.versions')

/** Every version this checkout can run, newest first: the current one plus the repository's v* tags. */
function availableVersions(): string[] {
  const tags = execFileSync('git', ['tag', '--list', 'v*'], { cwd: BENCH_ROOT, encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((tag) => tag.slice(1))
  return [...new Set([BENCHMARK_VERSION, ...tags])].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
}

/** "v1", "1" and "1.0" all name version 1. */
export function normalizeVersion(version: string): string {
  return version.replace(/^v/, '').replace(/\.0$/, '')
}

/** The command-line arguments without `--version <v>` or `--version=<v>`, for handing to another version's CLI. */
export function withoutVersionFlag(args: string[]): string[] {
  const kept: string[] = []
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version') i += 1
    else if (!args[i].startsWith('--version=')) kept.push(args[i])
  }
  return kept
}

/** Runs the CLI of an earlier version with `args`, checking it out on first use; returns its exit code. */
export function runWithVersion(version: string, args: string[]): number {
  const known = availableVersions()
  if (!known.includes(version)) throw new Error(`Unknown benchmark version "${version}". Available: ${known.join(', ')}`)
  const dir = path.join(VERSIONS_DIR, `v${version}`)
  if (!fs.existsSync(dir)) {
    console.log(`Checking out benchmark v${version} into ${path.relative(process.cwd(), dir)} (first use only) ...`)
    execFileSync('git', ['worktree', 'add', '--detach', dir, `v${version}`], { cwd: BENCH_ROOT, stdio: 'inherit' })
    execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: dir, stdio: 'inherit' })
    // Runs set up or graded under the earlier version live with all the others.
    fs.rmSync(path.join(dir, 'runs'), { recursive: true, force: true })
    fs.symlinkSync(RUNS_DIR, path.join(dir, 'runs'))
  }
  console.log(`Running under benchmark v${version} (latest is v${BENCHMARK_VERSION})`)
  return spawnSync(process.execPath, [path.join(dir, 'src', 'cli.ts'), ...args], { stdio: 'inherit' }).status ?? 1
}
