import fs from 'node:fs'
import { BRIEF_TEMPLATE } from './paths.ts'
import type { AssetInfo, Scenario } from './scenario.ts'
import { formatWithOffset, offsetMinutesOf } from './time.ts'

/** Renders the task prompt the agent under test receives as `BRIEF.md`. */
export function renderBrief(scenario: Scenario, assets: AssetInfo[]): string {
  const tenSecondsBefore = new Date(Date.parse(scenario.target) - 10_000)
  const values: Record<string, string> = {
    title: scenario.title,
    event: scenario.event,
    target: scenario.target,
    targetLabel: scenario.targetLabel,
    context: scenario.context ?? '',
    nowExample: formatWithOffset(tenSecondsBefore, offsetMinutesOf(scenario.target)),
    assetList: assets.length
      ? assets.map((asset) => `  - \`assets/${asset.file}\` (${formatBytes(asset.bytes)})`).join('\n')
      : '  - (no assets were provided for this scenario)',
  }

  const template = fs.readFileSync(BRIEF_TEMPLATE, 'utf8')
  const rendered = template.replace(/{{(\w+)}}/g, (_, key: string) => {
    if (!(key in values)) throw new Error(`${BRIEF_TEMPLATE}: unknown placeholder {{${key}}}`)
    return values[key]
  })
  // An empty optional section leaves a run of blank lines behind.
  return rendered.replace(/\n{3,}/g, '\n\n')
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}
