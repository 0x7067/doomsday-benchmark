import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CriterionVerdict, JudgeResult } from '../src/grade/judges.ts'
import { EXPERIENCE_RUBRIC } from '../src/grade/rubrics.ts'
import { finalScores, scoreRun } from '../src/grade/score.ts'
import type { ExperienceReport } from '../src/grade/experience.ts'
import type { StaticReport } from '../src/grade/static-checks.ts'

const verdicts = (score: (id: string) => number): Record<string, CriterionVerdict> =>
  Object.fromEntries(EXPERIENCE_RUBRIC.criteria.map((c) => [c.id, { evidence: '', score: score(c.id) }]))

function experienceLine(result: Omit<JudgeResult, 'rubric' | 'summary' | 'error'>) {
  // Scoring reads only these parts of the automated reports.
  const statics = { scaffoldReplaced: false } as StaticReport
  const experience = { moments: [], ticks: { ok: false }, reachesZero: { ok: false }, consoleErrors: [], externalRequests: [], probes: { findings: [] }, error: null } as unknown as ExperienceReport
  const card = scoreRun(statics, experience, [{ rubric: 'experience', summary: '', error: null, ...result }])
  return card.lines.find((line) => line.rubric === 'experience')!
}

test('an imitated asset caps asset selection and costs points of its own', () => {
  const criteria = verdicts(() => 9)
  const scores = finalScores(EXPERIENCE_RUBRIC, { criteria, findings: { assets: [{ file: 'logo.png', outcome: 'imitated', note: '' }] } })
  assert.deepEqual(scores.asset_selection, { score: 3, cappedFrom: 9, cappedBy: 'an imitated asset' })
  assert.equal(scores.cohesion.cappedFrom, null)
})

test('net-effect criteria run from minus to plus their points, with zero for none', () => {
  const neutral = experienceLine({ criteria: verdicts((id) => (id === 'initiative' || id === 'sound' ? 0 : 10)), findings: {} })
  const best = experienceLine({ criteria: verdicts((id) => (id === 'initiative' || id === 'sound' ? 5 : 10)), findings: {} })
  const worst = experienceLine({ criteria: verdicts((id) => (id === 'initiative' || id === 'sound' ? -5 : 10)), findings: {} })
  assert.equal(neutral.points, 38)
  assert.equal(best.points, 45)
  assert.equal(worst.points, 31)
})

test('copy that is not for the visitor costs points, up to a cap', () => {
  const copy = Array.from({ length: 5 }, (_, i) => ({ problem: `tech stack line ${i + 1}`, lines: ['Built with React'], category: 'builder' as const, reason: '' }))
  const line = experienceLine({ criteria: verdicts((id) => (id === 'initiative' || id === 'sound' ? 5 : 10)), findings: { copy } })
  assert.equal(line.points, 35)
  assert.ok(line.details.some((d) => d.startsWith('−10 copy') && d.includes('capped from −15')))
})
