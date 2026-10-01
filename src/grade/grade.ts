import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { runPaths } from '../paths.ts'
import { readMeta } from '../run-meta.ts'
import { loadGradingFacts, scenarioAssetsDir } from '../scenario.ts'
import { writeAssetPreviews } from './asset-previews.ts'
import { analyzeAssets } from './assets.ts'
import { checkExperience } from './experience.ts'
import { runJudges, type Evidence } from './judges.ts'
import { collectProcessFacts, type ProcessFacts } from './process.ts'
import { buildShippedFiles } from './shipped-build.ts'
import { writeReport } from './report.ts'
import { scoreRun, type ScoreCard } from './score.ts'
import { runStaticChecks } from './static-checks.ts'
import { previousVerdicts, type Verdicts } from './verdicts.ts'

export interface GradeOptions {
  /** Null skips the LLM judges and scores only the automated checks. */
  judgeModel: string | null
  /** Keep the verdicts from the run's previous report instead of judging again. */
  reuseJudges?: boolean
  /** A transcript file from any harness; defaults to `.bench/transcript.*`. */
  transcript?: string
}

export async function gradeRun(runDir: string, options: GradeOptions): Promise<{ card: ScoreCard; reportFile: string; processFacts: ProcessFacts }> {
  const paths = runPaths(runDir)
  const meta = readMeta(paths)
  // Read before the old report is cleared.
  const reused = options.reuseJudges ? previousVerdicts(paths) : null
  fs.rmSync(paths.report, { recursive: true, force: true })
  fs.mkdirSync(paths.report, { recursive: true })

  if (!fs.existsSync(path.join(paths.app, 'node_modules'))) {
    execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: paths.app, stdio: 'inherit' })
  }
  // The agent may have moved or edited its copy, so judges look at the originals.
  const originalAssets = scenarioAssetsDir(meta.scenario.id)
  const assetViews = fs.existsSync(originalAssets) ? await writeAssetPreviews(originalAssets, path.join(paths.report, 'assets')) : {}
  if (!fs.existsSync(originalAssets)) console.warn(`warning: ${originalAssets} no longer exists; judges won't see the original assets`)

  console.log('Build, type-check, lint and dead-code checks ...')
  const buildDir = path.join(paths.bench, 'shipped-build')
  const shipped = buildShippedFiles(paths.app, buildDir)
  const statics = runStaticChecks(paths.app, { shipped, providedAssets: new Set(meta.assets.map((asset) => asset.sha256)) })
  console.log('Browser checks and sound recordings ...')
  const experience = await checkExperience(paths.app, path.join(paths.report, 'captures'), path.join(paths.report, 'audio'), meta.scenario.target)
  console.log('Matching provided assets ...')
  const assets = await analyzeAssets(meta.assets, originalAssets, paths.app, shipped, buildDir).finally(() => fs.rmSync(buildDir, { recursive: true, force: true }))
  const processFacts = collectProcessFacts(paths, meta.agent ?? null, options.transcript)
  const evidence: Evidence = { paths, meta, statics, experience, assets, assetViews, processFacts, grading: loadGradingFacts(meta.scenario.id) }

  let verdicts: Verdicts | null = reused
  if (reused) {
    console.log(`Reusing the ${reused.model} verdicts from ${reused.judgedAt}`)
  } else if (options.judgeModel) {
    console.log(`Judging with ${options.judgeModel} (experience and code in parallel, then process; this takes a while) ...`)
    const judgedAt = new Date().toISOString()
    verdicts = { model: options.judgeModel, judgedAt, results: await runJudges(evidence, options.judgeModel), reused: false }
  }

  const card = scoreRun(statics, experience, verdicts?.results ?? null, processFacts.groundRules)
  const reportFile = writeReport(paths, { evidence, verdicts, card })
  return { card, reportFile, processFacts }
}
