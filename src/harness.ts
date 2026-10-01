import fs from 'node:fs'
import path from 'node:path'
import { BENCH_ROOT, type RunPaths } from './paths.ts'

export const HARNESSES = ['claude-code', 'codex', 'opencode', 'jcode'] as const
export type Harness = (typeof HARNESSES)[number]

/** How many of the newest images the harness keeps in the agent's context. */
export interface ImageWindow {
  min: number
  max: number
}

const HARNESS_BY_EXECUTABLE: Record<string, Harness> = { claude: 'claude-code', codex: 'codex', opencode: 'opencode', jcode: 'jcode' }

/** The harness a shell command starts, judged by its executable; null when it can't tell. */
export function detectHarness(command: string): Harness | null {
  const executable = command
    .trim()
    .split(/\s+/)
    .find((token) => !/^\w+=/.test(token))
  return executable ? (HARNESS_BY_EXECUTABLE[path.basename(executable)] ?? null) : null
}

export function parseHarness(name: string): Harness {
  const harness = HARNESSES.find((h) => h === name)
  if (!harness) throw new Error(`--harness must be one of: ${HARNESSES.join(', ')}`)
  return harness
}

/*
 * OpenCode resends every image the agent has opened on every request, and some
 * of its providers reject more than 30 per request. Its plugin drops the oldest
 * images in blocks, keeping between OPENCODE_IMAGE_BLOCK and twice that minus
 * one. Every other harness is left exactly as it is.
 */
const OPENCODE_PLUGIN = path.join(BENCH_ROOT, 'adapters', 'opencode', 'recent-images.js')
const OPENCODE_IMAGE_BLOCK = 13

/** Installs the harness's adapters into the run directory and returns the image window they enforce. */
export function installAdapters(paths: RunPaths, harness: Harness | null): ImageWindow | null {
  if (harness !== 'opencode') return null
  const plugins = path.join(paths.root, '.opencode', 'plugins')
  fs.mkdirSync(plugins, { recursive: true })
  fs.copyFileSync(OPENCODE_PLUGIN, path.join(plugins, 'recent-images.js'))
  fs.writeFileSync(path.join(plugins, 'recent-images.json'), `${JSON.stringify({ imageBlock: OPENCODE_IMAGE_BLOCK })}\n`)
  return { min: OPENCODE_IMAGE_BLOCK, max: 2 * OPENCODE_IMAGE_BLOCK - 1 }
}
