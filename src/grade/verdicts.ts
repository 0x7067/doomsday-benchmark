import fs from 'node:fs'
import path from 'node:path'
import type { RunPaths } from '../paths.ts'
import type { JudgeResult } from './judges.ts'
import { RUBRICS } from './rubrics.ts'

/** The judges' results for a run, and where they came from. */
export interface Verdicts {
  model: string
  judgedAt: string
  results: JudgeResult[]
  /** True when taken from an earlier grading instead of judging again. */
  reused: boolean
}

/**
 * The verdicts from the run's last report, so a regrade can pick up grader
 * changes without calling the judges again. Refuses verdicts that no longer
 * match the current rubrics, or that come from a judge that failed.
 */
export function previousVerdicts(paths: RunPaths): Verdicts {
  const file = path.join(paths.report, 'score.json')
  if (!fs.existsSync(file)) throw new Error(`${file} doesn't exist; grade once with judges before reusing them`)
  const previous = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    gradedAt: string
    judgedAt?: string
    judgeModel: string | null
    judges: JudgeResult[] | null
  }
  if (!previous.judges || !previous.judgeModel) throw new Error('The last grading ran without judges, so there are no verdicts to reuse')

  for (const rubric of RUBRICS) {
    const criteria = previous.judges.find((result) => result.rubric === rubric.id)?.criteria
    const missing = criteria ? rubric.criteria.filter((c) => !(c.id in criteria)).map((c) => c.id) : []
    if (!criteria || missing.length) {
      const detail = criteria ? `it lacks ${missing.join(', ')}` : 'that judge failed or never ran'
      throw new Error(`Can't reuse the previous ${rubric.id} verdict: ${detail}. Grade again without --reuse-judges.`)
    }
  }
  // An earlier reuse keeps the original judging time. Reports from before judges itemized have no lists.
  const results = previous.judges.map((result) => ({ ...result, findings: result.findings ?? {} }))
  return { model: previous.judgeModel, judgedAt: previous.judgedAt ?? previous.gradedAt, results, reused: true }
}
