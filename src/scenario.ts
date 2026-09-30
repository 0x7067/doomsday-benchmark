import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { SCENARIOS_DIR } from './paths.ts'

export interface Scenario {
  id: string
  /** Name of the thing being counted down to, used as the page's subject. */
  title: string
  /** One sentence describing the moment, e.g. "the release of ... on Nintendo Switch". */
  event: string
  /** The instant the clock hits zero, as an ISO 8601 timestamp with an explicit offset. */
  target: string
  /** Human-readable form of `target`, including the timezone. */
  targetLabel: string
  /** Optional extra context for the brief (Markdown). */
  context?: string
}

export interface AssetInfo {
  file: string
  bytes: number
  sha256: string
}

/**
 * What the grader knows about a scenario that the agent never sees, from
 * `scenarios/<id>/grading.json`. It stays out of the run directory, so the
 * agent can't read it.
 */
export interface GradingFacts {
  /** The IANA time zone the moment is announced in, used to check time claims in the page's copy. */
  timeZone?: string
  /** What each provided asset is, keyed by its file name, for example "the official logo". */
  assetRoles?: Record<string, string>
  /** Facts about the subject's canon that judges check the page's faithfulness against. */
  reference?: string[]
}

export function loadGradingFacts(scenarioId: string): GradingFacts {
  const file = path.join(SCENARIOS_DIR, scenarioId, 'grading.json')
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as GradingFacts) : {}
}

export function scenarioAssetsDir(scenarioId: string): string {
  return path.join(SCENARIOS_DIR, scenarioId, 'assets')
}

export function loadScenario(scenarioId: string): Scenario {
  const file = path.join(SCENARIOS_DIR, scenarioId, 'scenario.json')
  if (!fs.existsSync(file)) throw new Error(`Unknown scenario "${scenarioId}": ${file} does not exist`)
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<Scenario>

  for (const key of ['title', 'event', 'target', 'targetLabel'] as const) {
    if (typeof raw[key] !== 'string' || !raw[key]) throw new Error(`${file}: "${key}" must be a non-empty string`)
  }
  const target = raw.target as string
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(target) || Number.isNaN(Date.parse(target))) {
    throw new Error(`${file}: "target" must be an ISO 8601 timestamp with an offset, got "${target}"`)
  }
  return { ...(raw as Scenario), id: scenarioId }
}

/** Every file in the scenario's assets directory (recursively), with content hashes. */
export function listAssets(assetsDir: string): AssetInfo[] {
  if (!fs.existsSync(assetsDir)) return []
  return fs
    .readdirSync(assetsDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => !path.basename(file).startsWith('.'))
    .map((file) => path.join(assetsDir, file))
    .filter((file) => fs.statSync(file).isFile())
    .sort()
    .map((file) => {
      const content = fs.readFileSync(file)
      return {
        file: path.relative(assetsDir, file),
        bytes: content.length,
        sha256: createHash('sha256').update(content).digest('hex'),
      }
    })
}
