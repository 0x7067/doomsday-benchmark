import fs from 'node:fs'
import type { Harness, ImageWindow } from './harness.ts'
import type { RunPaths } from './paths.ts'
import type { AssetInfo, Scenario } from './scenario.ts'

export interface AgentRecord {
  /** Preset name from agents.json, or null for a custom --cmd. */
  preset: string | null
  model: string | null
  command: string
  startedAt: string
  finishedAt: string
  exitCode: number | null
  timedOut: boolean
}

export interface RunMeta {
  scenario: Scenario
  /** The assets the agent received, hashed at setup so grading can recognise copies. */
  assets: AssetInfo[]
  template: string
  createdAt: string
  /** Missing on runs set up before harnesses were recorded. */
  harness?: Harness | null
  /** Set when the harness adapter limits the images kept in the agent's context. */
  imageWindow?: ImageWindow | null
  /** The container image an isolated run's agent worked in; null or missing when it ran on this machine directly. */
  isolation?: { image: string } | null
  /** Present only when the agent was launched through `bench run`. */
  agent?: AgentRecord
}

export function readMeta(paths: RunPaths): RunMeta {
  if (!fs.existsSync(paths.meta)) throw new Error(`${paths.root} is not a run directory (missing ${paths.meta})`)
  return JSON.parse(fs.readFileSync(paths.meta, 'utf8')) as RunMeta
}

export function writeMeta(paths: RunPaths, meta: RunMeta): void {
  fs.writeFileSync(paths.meta, `${JSON.stringify(meta, null, 2)}\n`)
}
