import { spawn } from 'node:child_process'
import fs from 'node:fs'
import { AGENT_PRESETS, type RunPaths } from './paths.ts'
import type { AgentRecord } from './run-meta.ts'

export interface AgentCommand {
  preset: string | null
  model: string | null
  command: string
}

/**
 * Turns `--agent <preset>` or `--cmd "<shell>"` into the shell command to run.
 * Presets live in agents.json; `{model}` in a preset is replaced by `--model`.
 */
export function resolveAgentCommand(options: { agent?: string; cmd?: string; model?: string }): AgentCommand {
  const model = options.model ?? null
  if (options.cmd) return { preset: null, model, command: options.cmd }
  if (!options.agent) throw new Error('Pass --agent <preset> or --cmd "<shell command>"')

  const presets = JSON.parse(fs.readFileSync(AGENT_PRESETS, 'utf8')) as Record<string, string>
  const preset = presets[options.agent]
  if (!preset) throw new Error(`Unknown agent "${options.agent}". Presets: ${Object.keys(presets).join(', ')}`)
  if (preset.includes('{model}') && !model) throw new Error(`The "${options.agent}" preset needs --model`)
  return { preset: options.agent, model, command: model ? preset.replaceAll('{model}', model) : preset }
}

/**
 * Runs the agent with its cwd set to the run directory, teeing its output to
 * the terminal and to the transcript file.
 */
export function launchAgent(paths: RunPaths, agent: AgentCommand, timeoutMinutes: number): Promise<AgentRecord> {
  const startedAt = new Date().toISOString()
  const transcript = fs.createWriteStream(paths.transcript)
  // Its own process group, so a timeout or Ctrl+C stops everything the command started.
  const child = spawn('sh', ['-c', agent.command], { cwd: paths.root, stdio: ['ignore', 'pipe', 'pipe'], detached: true })
  const tee = (terminal: NodeJS.WriteStream) => (chunk: Buffer) => {
    transcript.write(chunk)
    terminal.write(chunk)
  }
  child.stdout.on('data', tee(process.stdout))
  child.stderr.on('data', tee(process.stderr))

  let timedOut = false
  const stopGroup = (signal: NodeJS.Signals) => {
    try {
      process.kill(-child.pid!, signal)
    } catch {
      // The group already exited.
    }
  }
  const stop = () => {
    stopGroup('SIGTERM')
    setTimeout(() => stopGroup('SIGKILL'), 10_000).unref()
  }
  const timer = setTimeout(() => {
    timedOut = true
    stop()
  }, timeoutMinutes * 60_000)
  process.once('SIGINT', stop)

  return new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (exitCode) => {
      clearTimeout(timer)
      process.off('SIGINT', stop)
      transcript.end(() =>
        resolve({ ...agent, startedAt, finishedAt: new Date().toISOString(), exitCode, timedOut }),
      )
    })
  })
}
