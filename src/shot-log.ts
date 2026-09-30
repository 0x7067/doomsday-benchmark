import fs from 'node:fs'
import type { RunPaths } from './paths.ts'

/** One screenshot the agent took with `./shot`. */
export interface ShotRecord {
  n: number
  file: string
  takenAt: string
  width: number
  height: number
  now: string | null
  path: string
  fullPage: boolean
  /** Snapshot of `app/` in the shadow history at the moment of the shot. */
  commit: string
  /** Console errors and uncaught exceptions the page produced. */
  problems: string[]
}

export function readShotLog(paths: RunPaths): ShotRecord[] {
  if (!fs.existsSync(paths.shotLog)) return []
  return fs
    .readFileSync(paths.shotLog, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ShotRecord)
}

export function appendShotLog(paths: RunPaths, record: ShotRecord): void {
  fs.appendFileSync(paths.shotLog, `${JSON.stringify(record)}\n`)
}
