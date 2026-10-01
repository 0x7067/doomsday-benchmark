import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { Harness } from './harness.ts'
import { BENCH_ROOT, type RunPaths } from './paths.ts'

/*
 * Isolated runs: the agent works in a Docker container that sees only its run
 * folder, mounted at /work, and a private home. Nothing else on this machine is
 * visible to it: not the benchmark, other runs, or other sessions' histories.
 * The harness gets just enough to work: its login, mounted read-only, or a
 * token passed by variable name so its value never appears in a command line.
 */

/** Where the run folder appears inside the container. */
export const CONTAINER_RUN_DIR = '/work'
/** Where the screenshot tool lives inside the container. */
export const CONTAINER_TOOL_DIR = '/opt/bench'
const CONTAINER_HOME = '/home/node'
const DOCKERFILE = path.join(BENCH_ROOT, 'isolation', 'Dockerfile')
/** The screenshot tool and the modules it imports. */
const SHOT_TOOL_FILES = ['shot.ts', 'history.ts', 'paths.ts', 'shot-log.ts', 'vite-server.ts']
/** Claude Code keeps its subscription login in the macOS Keychain, which a container can't reach; `claude setup-token` makes one it can use. */
const CLAUDE_TOKEN_VARIABLE = 'CLAUDE_CODE_OAUTH_TOKEN'
const CLAUDE_TOKEN_FILE = path.join(os.homedir(), '.config', 'doomsday-benchmark', 'claude-oauth-token')
/** Where each harness writes its log inside the container. */
const HARNESS_LOG_DIRS: Partial<Record<Harness, string>> = {
  opencode: `${CONTAINER_HOME}/.local/share/opencode/log`,
  codex: `${CONTAINER_HOME}/.codex/log`,
}

export interface IsolatedLaunch {
  command: string
  args: string[]
  /** Variables the docker command forwards by name. */
  env: Record<string, string>
  container: string
}

/** Builds the agent image if this version of it doesn't exist yet, and returns its tag. */
export function ensureImage(): string {
  const docker = spawnSync('docker', ['info'], { stdio: 'ignore' })
  if (docker.status !== 0) throw new Error('Isolated runs need Docker. Start Docker Desktop, or pass --no-isolation to run on this machine directly.')
  const sources = [DOCKERFILE, ...SHOT_TOOL_FILES.map((file) => path.join(BENCH_ROOT, 'src', file))]
  const hash = createHash('sha256')
  for (const source of sources) hash.update(path.relative(BENCH_ROOT, source)).update(fs.readFileSync(source))
  const tag = `doomsday-agent:${hash.digest('hex').slice(0, 12)}`
  if (spawnSync('docker', ['image', 'inspect', tag], { stdio: 'ignore' }).status === 0) return tag

  const context = fs.mkdtempSync(path.join(os.tmpdir(), 'doomsday-image-'))
  try {
    fs.copyFileSync(DOCKERFILE, path.join(context, 'Dockerfile'))
    fs.mkdirSync(path.join(context, 'shot', 'src'), { recursive: true })
    for (const file of SHOT_TOOL_FILES) fs.copyFileSync(path.join(BENCH_ROOT, 'src', file), path.join(context, 'shot', 'src', file))
    // Node runs .ts files as ES modules only when their package says so.
    fs.writeFileSync(path.join(context, 'shot', 'package.json'), `${JSON.stringify({ private: true, type: 'module' })}\n`)
    console.log(`Building the agent image ${tag} (only when it changes; this takes a few minutes) ...`)
    execFileSync('docker', ['build', '-t', tag, context], { stdio: 'inherit' })
  } finally {
    fs.rmSync(context, { recursive: true, force: true })
  }
  return tag
}

/** Fails early, before a run is set up, when the harness has no login it could use inside a container. */
export function checkContainerLogin(harness: Harness | null): void {
  if (harness === 'claude-code' && !claudeToken()) {
    throw new Error(
      `Isolated Claude Code runs need a login token. Run \`claude setup-token\` and save the token it prints to ${CLAUDE_TOKEN_FILE} (or set ${CLAUDE_TOKEN_VARIABLE}).`,
    )
  }
}

/** The docker command that runs `agentCommand` for a run, inside the container. */
export function isolatedLaunch(paths: RunPaths, agentCommand: string, harness: Harness | null, image: string): IsolatedLaunch {
  const container = `doomsday-${path.basename(paths.root)}`.replace(/[^a-zA-Z0-9_.-]/g, '-')
  const env: Record<string, string> = { AGENT_COMMAND: agentCommand }
  const args = [
    'run', '--rm', '--init', '--name', container,
    '-v', `${paths.root}:${CONTAINER_RUN_DIR}`,
    // The app's dependencies are installed inside, for Linux, in a volume of their own.
    '-v', `${CONTAINER_RUN_DIR}/app/node_modules`,
    '-w', CONTAINER_RUN_DIR,
    '-e', 'AGENT_COMMAND',
  ]
  for (const [hostFile, containerFile] of loginFiles(harness)) args.push('-v', `${hostFile}:${containerFile}:ro`)
  // The harness's own log would go with the container; kept, it can explain a run that died.
  const logDir = harness ? HARNESS_LOG_DIRS[harness] : undefined
  if (logDir) {
    fs.mkdirSync(path.join(paths.root, '.bench', 'harness-log'), { recursive: true })
    args.push('-v', `${path.join(paths.root, '.bench', 'harness-log')}:${logDir}`)
  }
  const token = harness === 'claude-code' ? claudeToken() : null
  if (token) {
    env[CLAUDE_TOKEN_VARIABLE] = token
    args.push('-e', CLAUDE_TOKEN_VARIABLE)
  }
  const setup = `(cd app && npm install --no-audit --no-fund > ${CONTAINER_RUN_DIR}/.bench/container-setup.log 2>&1)`
  args.push(image, 'sh', '-c', `${setup} && exec sh -c "$AGENT_COMMAND"`)
  return { command: 'docker', args, env, container }
}

/** Login files each harness reads, as [on this machine, in the container]. */
function loginFiles(harness: Harness | null): [string, string][] {
  const home = os.homedir()
  const candidates: Partial<Record<Harness, [string, string][]>> = {
    opencode: [[path.join(home, '.local/share/opencode/auth.json'), `${CONTAINER_HOME}/.local/share/opencode/auth.json`]],
    codex: [[path.join(home, '.codex/auth.json'), `${CONTAINER_HOME}/.codex/auth.json`]],
  }
  return (harness ? (candidates[harness] ?? []) : []).filter(([hostFile]) => fs.existsSync(hostFile))
}

function claudeToken(): string | null {
  const fromEnv = process.env[CLAUDE_TOKEN_VARIABLE]?.trim()
  if (fromEnv) return fromEnv
  return fs.existsSync(CLAUDE_TOKEN_FILE) ? fs.readFileSync(CLAUDE_TOKEN_FILE, 'utf8').trim() || null : null
}
