import type { ExperienceReport } from './experience.ts'
import type { CriterionVerdict, JudgeResult } from './judges.ts'
import { RUBRICS, type Criterion, type Rubric } from './rubrics.ts'
import type { StaticReport } from './static-checks.ts'

/*
 * 100 points: 10 for the countdown contract and 15 for code hygiene, both
 * automated, plus 75 from the judged rubrics (35 experience, 15 code,
 * 25 process). Judged scores go through `finalScores` so rubric caps apply.
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
  /** 100 when judged, 25 when only the automated checks ran. */
  max: number
  lines: ScoreLine[]
}

const HYGIENE_MAX = 15

export function scoreRun(statics: StaticReport, experience: ExperienceReport, judges: JudgeResult[] | null): ScoreCard {
  const lines = [scoreCountdown(experience), scoreHygiene(statics), ...(judges ?? []).map(scoreJudge)]
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
  const checks = [
    { label: 'exactly one valid duration <time> at every moment', max: 2, earned: moments.length && moments.every((m) => m.durations.length === 1 && m.actualSeconds !== null) ? 2 : 0 },
    { label: `correct remaining time (${correct}/${moments.length} moments)`, max: 4, earned: moments.length ? (4 * correct) / moments.length : 0 },
    { label: 'ticks every second', max: 1, earned: experience.ticks.ok ? 1 : 0 },
    { label: 'reaches zero on time', max: 1, earned: experience.reachesZero.ok ? 1 : 0 },
    { label: 'no console errors or uncaught exceptions', max: 1, earned: delivered && !experience.consoleErrors.length ? 1 : 0 },
    { label: 'no horizontal overflow on a 390px phone', max: 0.5, earned: delivered && !moments.some((m) => m.viewport === 'mobile' && m.horizontalOverflow) ? 0.5 : 0 },
    { label: 'no requests to other origins', max: 0.5, earned: delivered && !experience.externalRequests.length ? 0.5 : 0 },
  ]
  const details = checks.map((c) => `${c.earned === c.max ? '✓' : '✗'} ${c.label} (${round(c.earned)}/${c.max})`)
  if (experience.error) details.unshift(`Browser checks stopped early: ${experience.error}`)
  return { area: 'Countdown contract', kind: 'automated', points: round(checks.reduce((sum, c) => sum + c.earned, 0)), max: 10, details }
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
  const applied = penalties.filter((p) => p.count > 0).map((p) => ({ ...p, cost: Math.min(p.count * p.each, p.cap) }))
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
}

/**
 * Applies each criterion's cap to the judge's scores. This is what keeps a
 * polished page in the wrong idiom from scoring well on craft and motion.
 */
export function finalScores(rubric: Rubric, verdicts: Record<string, CriterionVerdict>): Record<string, FinalScore> {
  return Object.fromEntries(
    rubric.criteria.map((c) => {
      const judged = verdicts[c.id].score
      const limit = c.cap ? verdicts[c.cap.by].score + c.cap.margin : judged
      return [c.id, judged > limit ? { score: limit, cappedFrom: judged } : { score: judged, cappedFrom: null }]
    }),
  )
}

function scoreJudge(result: JudgeResult): ScoreLine {
  const rubric = RUBRICS.find((r) => r.id === result.rubric)!
  const max = rubric.criteria.reduce((sum, c) => sum + c.points, 0)
  const line = { area: rubric.title, kind: 'judged' as const, rubric: rubric.id, max }
  if (!result.criteria) return { ...line, points: 0, details: [`Not judged: ${result.error}`] }
  const scores = finalScores(rubric, result.criteria)
  const earned = (c: Criterion) => (scores[c.id].score / 10) * c.points
  const details = rubric.criteria.map((c) => `${c.title}: ${describeScore(scores[c.id], c)} (${round(earned(c))} of ${c.points} points)`)
  return { ...line, points: round(rubric.criteria.reduce((sum, c) => sum + earned(c), 0)), details }
}

export function describeScore({ score, cappedFrom }: FinalScore, criterion: Criterion): string {
  return cappedFrom === null ? `${score}/10` : `${score}/10, capped from ${cappedFrom} by ${criterion.cap!.by}`
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
