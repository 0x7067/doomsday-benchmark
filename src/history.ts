import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { RunPaths } from './paths.ts'

/*
 * A shadow git repository that records the state of `app/` every time the
 * agent takes a screenshot. It lives in `.bench/`, separate from the app's own
 * git repository, so the agent's commits (or lack of them) stay untouched.
 */

/** Commits made by the harness never depend on the machine's git config. */
export const GIT_IDENTITY = ['-c', 'user.name=doomsday-bench', '-c', 'user.email=bench@doomsday.local']

function git(paths: RunPaths, ...args: string[]): string {
  return execFileSync('git', ['--git-dir', paths.history, '--work-tree', paths.app, ...GIT_IDENTITY, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim()
}

export function initHistory(paths: RunPaths): void {
  git(paths, 'init', '--quiet')
  // Never record dependencies or build output, even if the agent edits .gitignore.
  fs.writeFileSync(path.join(paths.history, 'info', 'exclude'), 'node_modules/\ndist/\n')
}

/** Records the current state of `app/` and returns the commit hash. */
export function snapshot(paths: RunPaths, label: string): string {
  git(paths, 'add', '--all')
  git(paths, 'commit', '--quiet', '--allow-empty', '--message', label)
  return git(paths, 'rev-parse', 'HEAD')
}

export interface DiffStat {
  filesChanged: number
  insertions: number
  deletions: number
}

export interface SnapshotStat extends DiffStat {
  label: string
  commit: string
}

/** Every snapshot, oldest first, with the size of the change since the previous one. */
export function listSnapshots(paths: RunPaths): SnapshotStat[] {
  const log = git(paths, 'log', '--reverse', '--shortstat', '--format=@@%H %s')
  return log
    .split('@@')
    .filter(Boolean)
    .map((entry) => {
      const [header, stat = ''] = entry.trim().split('\n').filter(Boolean)
      const [commit, ...label] = header.split(' ')
      return { label: label.join(' '), commit, ...parseShortStat(stat) }
    })
}

export function diffStat(paths: RunPaths, from: string, to: string): DiffStat {
  return parseShortStat(git(paths, 'diff', '--shortstat', from, to))
}

function parseShortStat(stat: string): DiffStat {
  const count = (pattern: RegExp) => Number(pattern.exec(stat)?.[1] ?? 0)
  return {
    filesChanged: count(/(\d+) files? changed/),
    insertions: count(/(\d+) insertions?/),
    deletions: count(/(\d+) deletions?/),
  }
}
