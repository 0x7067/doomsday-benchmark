import path from 'node:path'
import { parseArgs } from 'node:util'
import { launchAgent, resolveAgentCommand } from './agents.ts'
import { gradeRun } from './grade/grade.ts'
import { detectHarness, HARNESSES, parseHarness } from './harness.ts'
import { readMeta, writeMeta } from './run-meta.ts'
import { setupRun } from './setup.ts'
import { buildSite, SITE_DIR } from './site/build-site.ts'
import { pagesBasePath, publishSite } from './site/publish-site.ts'
import { summarizeRun } from './format.ts'
import { readUsage, runDuration } from './usage.ts'
import { BENCHMARK_VERSION } from './version.ts'
import { normalizeVersion, runWithVersion, withoutVersionFlag } from './versions.ts'

const USAGE = `Usage:
  npm run bench -- setup --scenario <id> [--label <name>] [--harness <name>]
      Prepare a run directory, then drive any agent there yourself. Pass --harness
      (${HARNESSES.join(', ')}) so its adapters are installed.

  npm run bench -- run --scenario <id> (--agent <preset> [--model <model>] | --cmd "<shell command>")
                       [--label <name>] [--timeout <minutes>] [--harness <name>]
      Prepare a run directory and launch the agent in it. Presets are in agents.json.
      The harness is read from the command unless --harness is given.

  npm run bench -- grade <run-dir> [--judge-model <model>] [--no-judges | --reuse-judges] [--transcript <file>]
      Grade a finished run. Writes <run-dir>/report/REPORT.md. --reuse-judges keeps the
      previous report's judge verdicts and re-runs only the automated checks.

  npm run bench -- site [--publish]
      Build the results site from every graded run into _site/. --publish pushes it
      to the repository's gh-pages branch.

setup, run and grade use the latest benchmark version (v${BENCHMARK_VERSION}). Add --version <v>
to use an earlier one, such as --version 1; it runs that version's own code from its git tag.`

const DEFAULT_TIMEOUT_MINUTES = 240
const DEFAULT_JUDGE_MODEL = 'opus'

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      scenario: { type: 'string' },
      label: { type: 'string' },
      agent: { type: 'string' },
      model: { type: 'string' },
      cmd: { type: 'string' },
      timeout: { type: 'string', default: String(DEFAULT_TIMEOUT_MINUTES) },
      'judge-model': { type: 'string', default: DEFAULT_JUDGE_MODEL },
      'no-judges': { type: 'boolean', default: false },
      'reuse-judges': { type: 'boolean', default: false },
      transcript: { type: 'string' },
      harness: { type: 'string' },
      publish: { type: 'boolean', default: false },
      version: { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })
  const [command, runDir] = positionals

  if (values.help || !command) {
    console.log(USAGE)
    return
  }
  const version = values.version === undefined ? BENCHMARK_VERSION : normalizeVersion(values.version)
  if (version !== BENCHMARK_VERSION) {
    // The site shows every version side by side, so it's always built by the latest code.
    if (command === 'site') throw new Error('site always uses the latest version; drop --version')
    process.exitCode = runWithVersion(version, withoutVersionFlag(process.argv.slice(2)))
    return
  }

  switch (command) {
    case 'setup': {
      const harness = values.harness ? parseHarness(values.harness) : null
      const paths = setupRun(required(values.scenario, '--scenario'), { label: values.label, harness })
      console.log(`\nRun ready: ${paths.root}${harness ? ` (set up for ${harness})` : ''}`)
      console.log(`Start your agent with its working directory set to that folder and give it BRIEF.md as the prompt.`)
      console.log(`Afterwards, save its transcript as .bench/transcript.<ext> (optional) and run:`)
      console.log(`  npm run bench -- grade ${path.relative(process.cwd(), paths.root)}`)
      return
    }
    case 'run': {
      const agent = resolveAgentCommand(values)
      const timeout = Number(values.timeout)
      if (!Number.isFinite(timeout) || timeout <= 0) throw new Error('--timeout must be a positive number of minutes')
      const harness = values.harness ? parseHarness(values.harness) : detectHarness(agent.command)
      if (!harness) console.warn('warning: could not tell the harness from the command, so no adapters are installed; pass --harness')
      const paths = setupRun(required(values.scenario, '--scenario'), { label: values.label, harness })
      console.log(`\nLaunching ${harness ?? 'agent'} in ${paths.root}:\n  ${agent.command}\n`)
      const record = await launchAgent(paths, agent, timeout)
      writeMeta(paths, { ...readMeta(paths), agent: record })
      const usage = readUsage(paths.transcript, agent.model)
      console.log(`\nAgent finished (exit ${record.exitCode}${record.timedOut ? ', timed out' : ''}): ${summarizeRun(runDuration(record, usage), usage)}`)
      console.log('Grade it with:')
      console.log(`  npm run bench -- grade ${path.relative(process.cwd(), paths.root)}`)
      return
    }
    case 'grade': {
      if (values['no-judges'] && values['reuse-judges']) throw new Error('Pass --no-judges or --reuse-judges, not both')
      const { card, reportFile, processFacts } = await gradeRun(required(runDir, '<run-dir>'), {
        judgeModel: values['no-judges'] ? null : values['judge-model'],
        reuseJudges: values['reuse-judges'],
        transcript: values.transcript,
      })
      console.log(`\nScore: ${card.total} / ${card.max}`)
      for (const line of card.lines) console.log(`  ${line.area}: ${line.points} / ${line.max}`)
      console.log(`Run: ${summarizeRun(processFacts.duration, processFacts.usage)}`)
      console.log(`\nReport: ${reportFile}`)
      return
    }
    case 'site': {
      const basePath = pagesBasePath()
      console.log(`Building the results site for ${basePath} ...`)
      const runs = await buildSite(basePath)
      console.log(`Built ${runs.length} runs into ${SITE_DIR}`)
      if (values.publish) console.log(`Published: ${publishSite(SITE_DIR)} (GitHub can take a minute to update)`)
      return
    }
    default:
      throw new Error(`Unknown command "${command}"\n\n${USAGE}`)
  }
}

function required(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required\n\n${USAGE}`)
  return value
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
