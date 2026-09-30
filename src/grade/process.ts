import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { diffStat, listSnapshots, snapshot, type DiffStat, type SnapshotStat } from '../history.ts'
import type { RunPaths } from '../paths.ts'
import type { AgentRecord } from '../run-meta.ts'
import { readShotLog, type ShotRecord } from '../shot-log.ts'
import { readUsage, runDuration, type RunDuration, type RunUsage } from '../usage.ts'
import { cleanTranscript } from './transcript.ts'

/** Harness-independent evidence of how the agent worked. */
export interface ProcessFacts {
  agent: AgentRecord | null
  duration: RunDuration | null
  /** Tokens and cost as the harness reported them in the transcript. */
  usage: RunUsage | null
  shots: ShotRecord[]
  /** Minutes between the first and the last screenshot. */
  shotSpanMinutes: number | null
  snapshots: SnapshotStat[]
  /** Code changed after the agent's last screenshot, i.e. never looked at. */
  changedAfterLastShot: DiffStat
  /** The agent's own commits in app/, newest first. */
  appCommits: string[]
  handover: string | null
  /** The cleaned transcript written for the judges, relative to the run root. */
  transcript: { source: string; cleaned: string; bytes: number } | null
}

export function collectProcessFacts(paths: RunPaths, agent: AgentRecord | null, transcriptOverride?: string): ProcessFacts {
  const finalCommit = snapshot(paths, 'grading')
  const snapshots = listSnapshots(paths)
  const shots = readShotLog(paths)
  const lastLooked = shots.at(-1)?.commit ?? snapshots[0].commit
  const transcriptSource = transcriptOverride ? path.resolve(transcriptOverride) : findTranscript(paths)
  const usage = transcriptSource ? readUsage(transcriptSource) : null

  return {
    agent,
    duration: runDuration(agent, usage),
    usage,
    shots,
    shotSpanMinutes: shots.length ? minutesBetween(shots[0].takenAt, shots.at(-1)!.takenAt) : null,
    snapshots,
    changedAfterLastShot: diffStat(paths, lastLooked, finalCommit),
    appCommits: appCommits(paths.app),
    handover: fs.existsSync(paths.handover) ? fs.readFileSync(paths.handover, 'utf8') : null,
    transcript: transcriptSource ? writeCleanTranscript(paths, transcriptSource) : null,
  }
}

function minutesBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / 6_000) / 10
}

function appCommits(appDir: string): string[] {
  try {
    const log = execFileSync('git', ['log', '--format=%h %ad %s', '--date=iso'], { cwd: appDir, encoding: 'utf8' })
    // The oldest commit is the harness's scaffold.
    return log.trim().split('\n').slice(0, -1)
  } catch {
    return []
  }
}

function findTranscript(paths: RunPaths): string | null {
  if (!fs.existsSync(paths.bench)) return null
  const name = fs.readdirSync(paths.bench).find((file) => file.startsWith('transcript.'))
  return name ? path.join(paths.bench, name) : null
}

function writeCleanTranscript(paths: RunPaths, source: string): ProcessFacts['transcript'] {
  const cleaned = path.join(paths.report, 'transcript.txt')
  const text = cleanTranscript(fs.readFileSync(source, 'utf8'))
  fs.writeFileSync(cleaned, text)
  return { source, cleaned: path.relative(paths.root, cleaned), bytes: Buffer.byteLength(text) }
}
