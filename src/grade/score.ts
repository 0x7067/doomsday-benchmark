import type { OutsideAccess } from './boundary.ts'
import type { ExperienceReport } from './experience.ts'
import type { CopyFinding, CriterionVerdict, JudgeResult } from './judges.ts'
import { RUBRICS, type Criterion, type Rubric } from './rubrics.ts'
import type { StaticReport } from './static-checks.ts'

/*
 * 100 points: 5 for the countdown contract and 10 for code hygiene, both
 * automated, plus 85 from the judged rubrics (45 experience, 15 code,
 * 25 process). Judged scores go through `finalScores` so rubric caps apply.
 * Where judges itemize, the counting happens here: lines of copy that aren't
 * for the visitor and imitated assets cost experience points.
 */

export interface ScoreLine {
  area: string
  kind: 'automated' | 'judged'
  /** Set on judged lines. */
  rubric?: Rubric['id']
  points: number
  max: number
  details: string[]
}

export interface ScoreCard {
  total: number
  /** 100 when judged, 15 when only the automated checks ran. */
  max: number
  lines: ScoreLine[]
}

const COUNTDOWN_MAX = 5
/** V1.1 moved five of hygiene's 15 points to experience; the deductions keep their V1 proportions. */
const HYGIENE_MAX = 10
const HYGIENE_SCALE = HYGIENE_MAX / 15

/** Points each confirmed copy problem costs, by category, up to COPY_COST_CAP in all. */
const COPY_COSTS: Record<CopyFinding['category'], number> = { builder: 3, leaked: 3, false: 2, filler: 1 }
const COPY_COST_CAP = 10
/** An asset replaced by a homemade imitation caps asset selection and costs points of its own as a brand error. */
const IMITATION_SELECTION_CAP = 3
const IMITATION_COST = 3
/** Process points each area outside the run folder costs, when the brief told the agent to stay inside. */
const OUTSIDE_AREA_COST = 2
const OUTSIDE_COST_CAP = 6

/** Whether the agent kept to the brief's ground rules. */
export interface GroundRules {
  stayInsideRule: boolean
  outside: OutsideAccess[]
}

export function scoreRun(statics: StaticReport, experience: ExperienceReport, judges: JudgeResult[] | null, groundRules: GroundRules): ScoreCard {
  const lines = [scoreCountdown(experience), scoreHygiene(statics), ...(judges ?? []).map((result) => scoreJudge(result, groundRules))]
  return {
    total: round(lines.reduce((sum, line) => sum + line.points, 0)),
    max: lines.reduce((sum, line) => sum + line.max, 0),
    lines,
  }
}

function scoreCountdown(experience: ExperienceReport): ScoreLine {
  const { moments } = experience
  const correct = moments.filter((m) => m.correct).length
  // Clean-console, layout and offline checks only count once there is a countdown to check.
  const delivered = moments.some((m) => m.actualSeconds !== null)
  const emptyScroll = experience.probes.findings.filter((f) => f.kind === 'empty-scroll').map((f) => f.viewport)
  const checks = [
    { label: 'exactly one valid duration <time> at every moment', max: 1, earned: moments.length && moments.every((m) => m.durations.length === 1 && m.actualSeconds !== null) ? 1 : 0 },
    { label: `correct remaining time (${correct}/${moments.length} moments)`, max: 2, earned: moments.length ? (2 * correct) / moments.length : 0 },
    { label: 'ticks every second', max: 0.5, earned: experience.ticks.ok ? 0.5 : 0 },
    { label: 'reaches zero on time', max: 0.5, earned: experience.reachesZero.ok ? 0.5 : 0 },
    { label: 'no console errors or uncaught exceptions', max: 0.25, earned: delivered && !experience.consoleErrors.length ? 0.25 : 0 },
    { label: 'no horizontal overflow on a 390px phone', max: 0.25, earned: delivered && !moments.some((m) => m.viewport === 'mobile' && m.horizontalOverflow) ? 0.25 : 0 },
    { label: `no scrolling to an empty page${emptyScroll.length ? ` (${emptyScroll.join(', ')})` : ''}`, max: 0.25, earned: delivered && !emptyScroll.length ? 0.25 : 0 },
    { label: 'no requests to other origins', max: 0.25, earned: delivered && !experience.externalRequests.length ? 0.25 : 0 },
  ]
  const details = checks.map((c) => `${c.earned === c.max ? '✓' : '✗'} ${c.label} (${round(c.earned)}/${c.max})`)
  if (experience.error) details.unshift(`Browser checks stopped early: ${experience.error}`)
  return { area: 'Countdown contract', kind: 'automated', points: round(checks.reduce((sum, c) => sum + c.earned, 0)), max: COUNTDOWN_MAX, details }
}

function scoreHygiene(statics: StaticReport): ScoreLine {
  if (!statics.scaffoldReplaced) {
    return { area: 'Code hygiene', kind: 'automated', points: 0, max: HYGIENE_MAX, details: ['app/src is still the untouched scaffold, so there is nothing to credit'] }
  }
  const lintErrors = statics.lint.diagnostics.filter((d) => d.severity === 'error').length
  const penalties = [
    { label: '`npm run build` fails', count: statics.build.ok ? 0 : 1, each: 6, cap: 6 },
    { label: '`npm run lint` fails', count: statics.ownLint.ok ? 0 : 1, each: 2, cap: 2 },
    { label: 'type errors', count: statics.typecheck.errorCount, each: 1, cap: 4 },
    { label: 'lint errors (scaffold config)', count: lintErrors, each: 1, cap: 2 },
    { label: 'lint warnings (scaffold config)', count: statics.lint.diagnostics.length - lintErrors, each: 0.25, cap: 1 },
    { label: 'dead code (knip)', count: statics.deadCode.issues.length, each: 0.5, cap: 3 },
    { label: 'suppressions and `any`', count: statics.suppressions.length, each: 0.5, cap: 2 },
    { label: 'weakened compiler options', count: statics.weakenedCompilerOptions.length, each: 1, cap: 2 },
    { label: 'untouched scaffold files', count: statics.untouchedScaffold.length, each: 0.5, cap: 2 },
    { label: 'unreferenced files in src/ or public/', count: statics.orphanFiles.length, each: 0.5, cap: 2 },
    { label: 'stray files', count: statics.strayFiles.length, each: 0.5, cap: 1.5 },
    { label: 'debug logging', count: statics.debugLogging.length, each: 0.25, cap: 1 },
  ]
  const applied = penalties
    .filter((p) => p.count > 0)
    .map((p) => ({ ...p, cost: round(Math.min(p.count * p.each, p.cap) * HYGIENE_SCALE) }))
  const details = [...applied.map((p) => `−${p.cost} ${p.label} (${p.count})`), ...statics.notes]
  return {
    area: 'Code hygiene',
    kind: 'automated',
    points: round(Math.max(0, HYGIENE_MAX - applied.reduce((sum, p) => sum + p.cost, 0))),
    max: HYGIENE_MAX,
    details: details.length ? details : ['No problems found'],
  }
}

export interface FinalScore {
  score: number
  /** The judge's own score when a cap lowered it, otherwise null. */
  cappedFrom: number | null
  /** What lowered it: another criterion's id, or a reason. */
  cappedBy: string | null
}

/**
 * Applies each criterion's cap to the judge's scores. This is what keeps a
 * polished page in the wrong idiom from scoring well on craft and motion, and
 * an imitated asset from scoring well on asset selection.
 */
export function finalScores(rubric: Rubric, result: Pick<JudgeResult, 'findings'> & { criteria: Record<string, CriterionVerdict> }): Record<string, FinalScore> {
  const imitated = rubric.id === 'experience' && (result.findings.assets ?? []).some((a) => a.outcome === 'imitated')
  return Object.fromEntries(
    rubric.criteria.map((c) => {
      const judged = result.criteria[c.id].score
      const limits: [number, string][] = []
      if (c.cap) limits.push([result.criteria[c.cap.by].score + c.cap.margin, c.cap.by])
      if (c.id === 'asset_selection' && imitated) limits.push([IMITATION_SELECTION_CAP, 'an imitated asset'])
      const binding = limits.filter(([limit]) => judged > limit).sort((a, b) => a[0] - b[0])[0]
      return [c.id, binding ? { score: binding[0], cappedFrom: judged, cappedBy: binding[1] } : { score: judged, cappedFrom: null, cappedBy: null }]
    }),
  )
}

/** Points a criterion earns from its final score; net-effect criteria run from −points to +points. */
function earnedPoints(criterion: Criterion, score: number): number {
  return criterion.netEffect ? (score / 5) * criterion.points : (score / 10) * criterion.points
}

function scoreJudge(result: JudgeResult, groundRules: GroundRules): ScoreLine {
  const rubric = RUBRICS.find((r) => r.id === result.rubric)!
  const max = rubric.criteria.reduce((sum, c) => sum + c.points, 0)
  const line = { area: rubric.title, kind: 'judged' as const, rubric: rubric.id, max }
  if (!result.criteria) return { ...line, points: 0, details: [`Not judged: ${result.error}`] }
  const scores = finalScores(rubric, { criteria: result.criteria, findings: result.findings })
  const details = rubric.criteria.map((c) => `${c.title}: ${describeScore(scores[c.id], c)} (${formatPoints(earnedPoints(c, scores[c.id].score))} of ${c.points} points)`)
  const deductions = rubric.id === 'experience' ? experienceDeductions(result) : rubric.id === 'process' ? processDeductions(groundRules) : []
  details.push(...deductions.map((d) => (d.cost ? `−${d.cost} ${d.label}` : d.label)))
  const earned = rubric.criteria.reduce((sum, c) => sum + earnedPoints(c, scores[c.id].score), 0) - deductions.reduce((sum, d) => sum + d.cost, 0)
  return { ...line, points: round(Math.min(max, Math.max(0, earned))), details }
}

/** Costs counted from the experience judge's lists. */
function experienceDeductions(result: JudgeResult): { label: string; cost: number }[] {
  const deductions: { label: string; cost: number }[] = []
  const copy = result.findings.copy ?? []
  if (copy.length) {
    const raw = copy.reduce((sum, finding) => sum + COPY_COSTS[finding.category], 0)
    const counts = Object.keys(COPY_COSTS)
      .map((category) => [category, copy.filter((f) => f.category === category).length] as const)
      .filter(([, count]) => count > 0)
      .map(([category, count]) => `${count} ${category}`)
    deductions.push({ label: `copy that isn't for the visitor (${counts.join(', ')}${raw > COPY_COST_CAP ? `; capped from −${raw}` : ''})`, cost: Math.min(raw, COPY_COST_CAP) })
  }
  const imitations = (result.findings.assets ?? []).filter((a) => a.outcome === 'imitated')
  if (imitations.length) deductions.push({ label: `provided asset replaced by an imitation (${imitations.map((a) => a.file).join(', ')})`, cost: IMITATION_COST })
  return deductions
}

/** Breaking the stay-inside rule costs points only when the brief stated it; otherwise it's reported. */
function processDeductions({ stayInsideRule, outside }: GroundRules): { label: string; cost: number }[] {
  if (!outside.length) return []
  const areas = outside.map((o) => o.area).join(', ')
  if (!stayInsideRule) return [{ label: `went outside the run folder (${areas}); not penalised, since this run's brief didn't forbid it`, cost: 0 }]
  return [{ label: `broke the ground rules: went outside the run folder (${areas})`, cost: Math.min(outside.length * OUTSIDE_AREA_COST, OUTSIDE_COST_CAP) }]
}

export function describeScore({ score, cappedFrom, cappedBy }: FinalScore, criterion: Criterion): string {
  const scale = criterion.netEffect ? `${score > 0 ? '+' : ''}${score} on −5 to +5` : `${score}/10`
  return cappedFrom === null ? scale : `${scale}, capped from ${cappedFrom} by ${cappedBy}`
}

function formatPoints(points: number): string {
  return String(round(points))
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
