import fs from 'node:fs'
import path from 'node:path'
import type { RunPaths } from '../paths.ts'
import { formatDuration, formatTokens, formatUsd } from '../format.ts'
import type { RunMeta } from '../run-meta.ts'
import type { RunDuration, RunUsage } from '../usage.ts'
import { detectHarness } from '../harness.ts'
import { BENCHMARK_VERSION } from '../version.ts'
import type { Evidence, JudgeResult } from './judges.ts'
import { RUBRICS } from './rubrics.ts'
import { describeScore, finalScores, type ScoreCard } from './score.ts'
import type { Verdicts } from './verdicts.ts'

export interface ReportInput {
  evidence: Evidence
  verdicts: Verdicts | null
  card: ScoreCard
}

/** Writes `report/score.json` (everything, for tooling) and `report/REPORT.md` (for people). */
export function writeReport(paths: RunPaths, input: ReportInput): string {
  const { evidence, verdicts, card } = input
  const json = {
    run: path.basename(paths.root),
    benchmarkVersion: BENCHMARK_VERSION,
    gradedAt: new Date().toISOString(),
    judgeModel: verdicts?.model ?? null,
    judgedAt: verdicts?.judgedAt ?? null,
    judgesReused: verdicts?.reused ?? false,
    card,
    judges: verdicts?.results ?? null,
    scenario: evidence.meta.scenario,
    agent: evidence.meta.agent ?? null,
    statics: evidence.statics,
    experience: evidence.experience,
    assets: evidence.assets,
    processFacts: evidence.processFacts,
  }
  fs.writeFileSync(path.join(paths.report, 'score.json'), `${JSON.stringify(json, null, 2)}\n`)

  const file = path.join(paths.report, 'REPORT.md')
  fs.writeFileSync(file, markdown(paths, input))
  return file
}

function timeTokensAndCost(duration: RunDuration | null, usage: RunUsage | null): string[] {
  const lines = ['## Time, tokens and cost', '']
  lines.push(`- **Run time:** ${duration ? `${formatDuration(duration.seconds)} (${duration.source})` : 'not recorded'}`)
  if (!usage) return [...lines, '- **Tokens and cost:** not reported (no transcript this benchmark can read)']
  const { tokens } = usage
  const reasoning = tokens.reasoning ? `, ${formatTokens(tokens.reasoning)} of it reasoning` : ''
  const output = tokens.output === null ? 'output unknown' : `${formatTokens(tokens.output)} output${reasoning}`
  lines.push(`- **Turns:** ${usage.turns}`)
  lines.push(
    `- **Tokens:** ${tokens.output === null ? 'at least ' : ''}${formatTokens(tokens.total)} in total: ` +
      `${formatTokens(tokens.cacheRead)} read from cache, ${formatTokens(tokens.cacheWrite)} written to cache, ` +
      `${formatTokens(tokens.input)} uncached input, ${output}`,
  )
  lines.push(`- **Estimated cost:** ${usage.costUsd === null ? 'not reported' : formatUsd(usage.costUsd)} (${usage.costBasis})`)
  return lines
}

/** The lists a judge itemized, as Markdown sections. */
function findingsMarkdown({ findings }: JudgeResult): string[] {
  const section = (title: string, items: string[] | undefined) => (items?.length ? ['', `### ${title}`, '', ...items] : [])
  return [
    ...section(`Changes before shipping (${findings.changes?.length ?? 0})`, findings.changes?.map((c) => `- [${c.severity}, ${c.effort}] ${c.request} (${c.where})`)),
    ...section('Copy that isn’t for the visitor', findings.copy?.map((c) => `- ${c.category}: ${c.problem} (${c.lines.map((line) => `“${line}”`).join(', ')}) — ${c.reason}`)),
    ...section('Asset ledger', findings.assets?.map((a) => `- \`${a.file}\`: ${a.outcome}. ${a.note}`)),
    ...section('Defect ledger', findings.ledger?.map((l) => `- ${l.outcome}, in ${l.seenIn} of its screenshots${l.firstVisibleIn ? ` from shot ${l.firstVisibleIn}` : ''}: ${l.problem}. ${l.note}`)),
    ...section('Claims', findings.claims?.map((c) => `- ${c.verdict}: ${c.claim} — ${c.evidence}`)),
  ]
}

function describeVerdicts(verdicts: Verdicts | null): string {
  if (!verdicts) return 'skipped (automated checks only)'
  const when = `${verdicts.judgedAt.slice(0, 16).replace('T', ' ')} UTC`
  return `${verdicts.model}, judged ${when}${verdicts.reused ? ' (verdicts reused; the judges did not see this grading)' : ''}`
}

function describeHarness({ harness, imageWindow, agent }: RunMeta): string {
  // Runs set up before harnesses were recorded: infer it from the launch command.
  if (harness === undefined) return agent ? `${detectHarness(agent.command) ?? 'unknown'} (inferred from the command)` : 'not recorded'
  const window = imageWindow ? `, keeping only the newest ${imageWindow.min}–${imageWindow.max} images in the agent's context` : ''
  return `${harness ?? 'unknown'}${window}`
}

function markdown(paths: RunPaths, { evidence, verdicts, card }: ReportInput): string {
  const { meta, processFacts: facts, experience } = evidence
  const agent = meta.agent
  const relativeToReport = (file: string) => path.relative(paths.report, path.resolve(paths.root, file))
  const out: string[] = []

  out.push(`# Doomsday benchmark V${BENCHMARK_VERSION}: ${path.basename(paths.root)}`, '')
  out.push(`- **Scenario:** ${meta.scenario.title}, counting down to ${meta.scenario.target}`)
  out.push(agent ? `- **Agent:** \`${agent.command}\` (exit ${agent.exitCode}${agent.timedOut ? ', timed out' : ''})` : '- **Agent:** launched manually')
  out.push(`- **Harness:** ${describeHarness(meta)}`)
  out.push(`- **Isolation:** ${meta.isolation ? `a container (\`${meta.isolation.image}\`) that saw only the run folder` : 'none; the agent ran on the grading machine'}`)
  out.push(`- **Judges:** ${describeVerdicts(verdicts)}`, '')

  out.push(`## Score: ${card.total} / ${card.max}`, '', '| Area | Kind | Points |', '| --- | --- | --- |')
  for (const line of card.lines) out.push(`| ${line.area} | ${line.kind} | ${line.points} / ${line.max} |`)
  out.push('', ...timeTokensAndCost(facts.duration, facts.usage), '')

  for (const line of card.lines) {
    out.push(`## ${line.area}: ${line.points} / ${line.max}`, '')
    const result = verdicts?.results.find((j) => j.rubric === line.rubric)
    if (result?.criteria) {
      out.push(result.summary, '')
      const rubric = RUBRICS.find((r) => r.id === result.rubric)!
      const scores = finalScores(rubric, { criteria: result.criteria, findings: result.findings })
      for (const criterion of rubric.criteria) {
        out.push(`- **${criterion.title}: ${describeScore(scores[criterion.id], criterion)}.** ${result.criteria[criterion.id].evidence}`)
      }
      // Deductions counted from the judge's lists come after the criteria in the score line.
      out.push(...line.details.slice(rubric.criteria.length).map((detail) => `- **${detail}**`))
      out.push(...findingsMarkdown(result))
    } else {
      out.push(...line.details.map((detail) => `- ${detail}`))
    }
    out.push('')
  }

  const { probes, sound } = experience
  if (probes.findings.length) {
    out.push('## Layout findings', '', ...probes.findings.map((f) => `- ${f.kind} (${f.viewport}): ${f.description}${f.capture ? ` ([close-up](${relativeToReport(f.capture)}))` : ''}`), '')
  }
  out.push('## Sound', '')
  if (sound.recordings.length === 0 && sound.contexts === 0) out.push('- The page makes no sound through Web Audio.')
  for (const r of sound.recordings) {
    const a = r.analysis
    const measured = a.activeShare < 0.02 ? 'silent' : `${a.seconds} s, ${Math.round(a.activeShare * 100)}% active, ${a.rmsDb} dBFS average, dynamic range ${a.dynamicRangeDb ?? '–'} dB, spectral change ${a.spectralChange ?? '–'}`
    out.push(`- **${r.label}:** ${measured}${r.image ? ` ([spectrogram](${relativeToReport(r.image)}))` : ''}`)
  }
  if (sound.controls.length) out.push('', 'Notes each control played:', '', ...sound.controls.map((c) => `- ${c.control}: ${c.notes.join(' ')}`))
  out.push('')

  const { stayInsideRule, outside } = facts.groundRules
  out.push('## Ground rules', '')
  out.push(`- Stay-inside rule in this run's brief: ${stayInsideRule ? 'yes' : 'no (the run predates it)'}`)
  if (!outside.length) out.push('- Its tool calls stayed inside the run folder.')
  for (const access of outside) out.push(`- Outside the run folder, ${access.area}: ${access.paths.slice(0, 8).map((p) => `\`${p}\``).join(', ')}${access.paths.length > 8 ? ', …' : ''}`)
  out.push('')

  out.push('## Process facts', '')
  out.push(`- Screenshots taken by the agent: ${facts.shots.length}, spanning ${facts.shotSpanMinutes ?? 0} minutes`)
  out.push(`- Screenshots it never opened: ${facts.unopenedShots.length ? `${facts.unopenedShots.length} (${facts.unopenedShots.join(', ')})` : 'none'}`)
  out.push(`- Changed after the last screenshot: ${facts.changedAfterLastShot.filesChanged} files, +${facts.changedAfterLastShot.insertions}/-${facts.changedAfterLastShot.deletions} lines`)
  out.push(`- Agent commits in app/: ${facts.appCommits.length}`)
  out.push(`- HANDOVER.md: ${facts.handover === null ? 'missing' : 'present'}`)
  out.push(`- Transcript: ${facts.transcript ? path.relative(paths.root, facts.transcript.source) : 'not provided'}`, '')

  out.push('## Grader captures', '')
  for (const capture of experience.captures) out.push(`- [${capture.caption}](${relativeToReport(capture.file)})`)
  out.push('')
  return out.join('\n')
}
