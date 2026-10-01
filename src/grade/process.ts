import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { diffStat, listSnapshots, snapshot, type DiffStat, type SnapshotStat } from '../history.ts'
import type { RunPaths } from '../paths.ts'
import type { AgentRecord } from '../run-meta.ts'
import { readShotLog, type ShotRecord } from '../shot-log.ts'
import { readUsage, runDuration, type RunDuration, type RunUsage } from '../usage.ts'
import { findOutsideAccess, type OutsideAccess } from './boundary.ts'
import { toolCallInputs } from './tool-calls.ts'
import { cleanTranscript } from './transcript.ts'

/** Where on the page something is, as the grader found it, for matching against the agent's screenshots. */
export interface PageSpot {
  viewport: 'desktop' | 'mobile'
  /** One of the grader's moments: weeks-out, final-hour, final-seconds or arrived, or plain for a visit without `?now`. */
  moment: string
  /** Distance from the top of the page, in pixels. */
  top: number
}

/** Harness-independent evidence of how the agent worked. */
export interface ProcessFacts {
  agent: AgentRecord | null
  duration: RunDuration | null
  /** Tokens and cost as the harness reported them in the transcript. */
  usage: RunUsage | null
  shots: ShotRecord[]
  /** The pixel height of each screenshot's image, by shot number; full-page shots are as tall as the page was. */
  shotHeights: Record<number, number>
  /** Screenshots no tool call ever named again: taken, but never opened or used. */
  unopenedShots: number[]
  /** Minutes between the first and the last screenshot. */
  shotSpanMinutes: number | null
  snapshots: SnapshotStat[]
  /** Code changed after the agent's last screenshot, i.e. never looked at. */
  changedAfterLastShot: DiffStat
  /** The agent's own commits in app/, newest first. */
  appCommits: string[]
  handover: string | null
  /** Files outside the run folder the agent's tool calls touched, and whether its brief told it to stay inside. */
  groundRules: { stayInsideRule: boolean; outside: OutsideAccess[] }
  /** The cleaned transcript written for the judges, relative to the run root. */
  transcript: { source: string; cleaned: string; bytes: number } | null
}

export function collectProcessFacts(paths: RunPaths, agent: AgentRecord | null, transcriptOverride?: string): ProcessFacts {
  const finalCommit = snapshot(paths, 'grading')
  const snapshots = listSnapshots(paths)
  const shots = readShotLog(paths)
  const lastLooked = shots.at(-1)?.commit ?? snapshots[0].commit
  const transcriptSource = transcriptOverride ? path.resolve(transcriptOverride) : findTranscript(paths)
  const usage = transcriptSource ? readUsage(transcriptSource, agent?.model) : null
  const transcriptText = transcriptSource ? fs.readFileSync(transcriptSource, 'utf8') : ''
  const toolInputs = toolCallInputs(transcriptText)

  return {
    agent,
    duration: runDuration(agent, usage),
    usage,
    shots,
    shotHeights: Object.fromEntries(shots.map((shot) => [shot.n, pngHeight(path.join(paths.root, shot.file)) ?? shot.height])),
    // Opening a screenshot, or cropping it to look closer, means a tool call names its file.
    unopenedShots: transcriptSource ? shots.filter((shot) => !toolInputs.some((input) => input.includes(path.basename(shot.file)))).map((shot) => shot.n) : [],
    shotSpanMinutes: shots.length ? minutesBetween(shots[0].takenAt, shots.at(-1)!.takenAt) : null,
    snapshots,
    changedAfterLastShot: diffStat(paths, lastLooked, finalCommit),
    appCommits: appCommits(paths.app),
    handover: fs.existsSync(paths.handover) ? fs.readFileSync(paths.handover, 'utf8') : null,
    groundRules: {
      stayInsideRule: fs.existsSync(paths.brief) && fs.readFileSync(paths.brief, 'utf8').includes(STAY_INSIDE_RULE),
      outside: transcriptSource ? findOutsideAccess(transcriptText, runRoots(paths)) : [],
    },
    transcript: transcriptSource ? writeCleanTranscript(paths, transcriptSource) : null,
  }
}

type ShotMoment = 'weeks-out' | 'final-day' | 'final-seconds' | 'arrived'
type ShotViewport = 'phone' | 'tablet' | 'desktop'

/** The moment a screenshot showed: its `--now`, a `?now=` in its path, or the time it was taken. */
function shotMoment(shot: ShotRecord, target: string): ShotMoment {
  const now = shot.now ?? new URLSearchParams(shot.path.split('?')[1] ?? '').get('now') ?? shot.takenAt
  const remaining = (Date.parse(target) - Date.parse(now)) / 1000
  if (Number.isNaN(remaining) || remaining > 86_400) return 'weeks-out'
  if (remaining > 60) return 'final-day'
  return remaining > 0 ? 'final-seconds' : 'arrived'
}

function shotViewport(width: number): ShotViewport {
  if (width < 600) return 'phone'
  return width < 1024 ? 'tablet' : 'desktop'
}

/** How many of the agent's screenshots showed each moment at each viewport size. */
export function shotCoverage(shots: ShotRecord[], target: string): Record<ShotViewport, Record<ShotMoment, number>> {
  const empty = () => ({ 'weeks-out': 0, 'final-day': 0, 'final-seconds': 0, arrived: 0 })
  const coverage = { phone: empty(), tablet: empty(), desktop: empty() }
  for (const shot of shots) coverage[shotViewport(shot.width)][shotMoment(shot, target)] += 1
  return coverage
}

/**
 * The agent's screenshots that showed a spot the grader found: same kind of
 * viewport, same moment, and either a full-page shot or a spot inside the
 * first screen. Layouts differ a little between widths in the same class, so
 * this is an estimate.
 */
export function shotsShowing(facts: Pick<ProcessFacts, 'shots' | 'shotHeights'>, target: string, spot: PageSpot): number[] {
  const viewport: ShotViewport = spot.viewport === 'mobile' ? 'phone' : 'desktop'
  // A visit without ?now happens weeks out, like the agent's own screenshots without one.
  const moment: ShotMoment = spot.moment === 'final-hour' ? 'final-day' : spot.moment === 'plain' ? 'weeks-out' : (spot.moment as ShotMoment)
  return facts.shots
    .filter((shot) => shotViewport(shot.width) === viewport && shotMoment(shot, target) === moment && spot.top < (facts.shotHeights[shot.n] ?? shot.height))
    .map((shot) => shot.n)
}

/** A PNG's height from its header, without decoding it. */
function pngHeight(file: string): number | null {
  if (!fs.existsSync(file)) return null
  const header = Buffer.alloc(24)
  const fd = fs.openSync(file, 'r')
  try {
    fs.readSync(fd, header, 0, 24, 0)
  } finally {
    fs.closeSync(fd)
  }
  return header.toString('ascii', 12, 16) === 'IHDR' ? header.readUInt32BE(20) : null
}

/** Words from the brief's ground rules; briefs written before the rule existed don't contain them. */
const STAY_INSIDE_RULE = "Stay inside this directory: don't read, search, run or change anything outside it."

/**
 * The run folder now, and where it was while the agent worked: runs get
 * archived, and the `./shot` wrapper records the original location.
 */
function runRoots(paths: RunPaths): string[] {
  const wrapper = fs.existsSync(paths.shotTool) ? fs.readFileSync(paths.shotTool, 'utf8') : ''
  const original = /--run "([^"]+)"/.exec(wrapper)?.[1]
  return [paths.root, ...(original && original !== paths.root ? [original] : [])]
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
