import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { renderBrief } from './brief.ts'
import { GIT_IDENTITY, initHistory, snapshot } from './history.ts'
import { installAdapters, type Harness } from './harness.ts'
import { CONTAINER_RUN_DIR, CONTAINER_TOOL_DIR } from './isolation.ts'
import { BENCH_ROOT, RUNS_DIR, TEMPLATE_DIR, TEMPLATE_ORIGIN, runPaths, type RunPaths } from './paths.ts'
import { writeMeta } from './run-meta.ts'
import { listAssets, loadScenario, scenarioAssetsDir } from './scenario.ts'

export interface SetupOptions {
  label?: string
  /** Decides which harness adapters are installed; null installs none. */
  harness: Harness | null
  /** The container image the agent will work in, or null to run it on this machine. */
  image: string | null
}

/**
 * Creates a fresh run directory: the brief, a copy of the assets, a scaffolded
 * and installed app, and the screenshot tool. Any agent can then start working
 * with its cwd set to the returned `root`.
 */
export function setupRun(scenarioId: string, { label, harness, image }: SetupOptions): RunPaths {
  if (label && !/^[\w.-]+$/.test(label)) throw new Error(`--label may only contain letters, digits, ".", "_" and "-"`)
  const scenario = loadScenario(scenarioId)
  const assetsDir = scenarioAssetsDir(scenarioId)
  const assets = listAssets(assetsDir)
  if (assets.length === 0) console.warn(`warning: ${assetsDir} is empty; the agent will get no assets`)

  const stamp = new Date().toISOString().slice(0, 19).replaceAll(':', '-')
  const paths = runPaths(path.join(RUNS_DIR, [scenarioId, label, stamp].filter(Boolean).join('_')))
  fs.mkdirSync(paths.shots, { recursive: true })

  fs.cpSync(TEMPLATE_DIR, paths.app, {
    recursive: true,
    filter: (source) => !path.relative(TEMPLATE_DIR, source).split(path.sep).includes('node_modules'),
  })
  fs.mkdirSync(paths.assets)
  if (assets.length) fs.cpSync(assetsDir, paths.assets, { recursive: true })
  fs.writeFileSync(paths.brief, renderBrief(scenario, assets, { isolated: image !== null }))
  writeShotTool(paths, image !== null)
  const imageWindow = installAdapters(paths, harness)

  // An isolated run installs them inside its container instead, for Linux.
  if (!image) {
    console.log(`Installing app dependencies in ${paths.app} ...`)
    execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: paths.app, stdio: 'inherit' })
  }
  initAppRepository(paths.app)
  initHistory(paths)
  snapshot(paths, 'setup')

  writeMeta(paths, { scenario, assets, template: TEMPLATE_ORIGIN, createdAt: new Date().toISOString(), harness, imageWindow, isolation: image ? { image } : null })
  return paths
}

/** The ./shot wrapper; in a container, the tool and the run folder have the container's paths. */
function writeShotTool(paths: RunPaths, isolated: boolean): void {
  const shotScript = isolated ? `${CONTAINER_TOOL_DIR}/src/shot.ts` : path.join(BENCH_ROOT, 'src', 'shot.ts')
  const runDir = isolated ? CONTAINER_RUN_DIR : paths.root
  const script = [
    '#!/bin/sh',
    '# Screenshot tool for this run; usage is described in BRIEF.md.',
    `exec node ${JSON.stringify(shotScript)} --run ${JSON.stringify(runDir)} "$@"`,
    '',
  ].join('\n')
  fs.writeFileSync(paths.shotTool, script, { mode: 0o755 })
}

function initAppRepository(appDir: string): void {
  const git = (...args: string[]) => execFileSync('git', [...GIT_IDENTITY, ...args], { cwd: appDir, stdio: 'ignore' })
  git('init', '--quiet', '--initial-branch', 'main')
  git('add', '--all')
  git('commit', '--quiet', '--message', `Scaffold app with ${TEMPLATE_ORIGIN}`)
}
