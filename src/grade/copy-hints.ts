import type { Scenario } from '../scenario.ts'

/*
 * Pointers for the copy audit. The brief's own framing and requirements are
 * the same for every scenario, so words from them that the scenario itself
 * never uses are likely to have leaked from the brief onto the page. A hint
 * is a lead for the judge, not a verdict.
 */

/** Words from the brief's framing (its inspiration and its requirements), in lower case. */
const BRIEF_TERMS = [
  'doomsday', 'marvel', 'avengers', 'livestream', 'youtube', 'benchmark', 'brief', 'handover', 'screenshot',
  'react', 'vite', 'typescript', 'backend', 'front-end', 'frontend', 'offline', 'bundle', 'network calls', 'lint',
  'staff engineer', 'datetime', 'epoch',
]
/** Machine-facing strings a visitor shouldn't meet. */
const TECHNICAL_PATTERNS: [RegExp, string][] = [
  [/\?now=/, 'the `?now=` testing parameter'],
  [/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'a raw ISO timestamp'],
  [/\b\d{12,}\b/, 'a raw epoch number'],
]

/** Why a line of copy deserves a closer look, or an empty list. */
export function copyHints(text: string, scenario: Scenario): string[] {
  const own = [scenario.title, scenario.event, scenario.context ?? '', scenario.targetLabel].join(' ').toLowerCase()
  const lower = text.toLowerCase()
  const terms = BRIEF_TERMS.filter((term) => new RegExp(`\\b${term.replace(/[-?]/g, '\\$&')}\\b`).test(lower) && !own.includes(term))
  return [
    ...terms.map((term) => `uses "${term}", a word from the brief's framing that the scenario itself doesn't use`),
    ...TECHNICAL_PATTERNS.filter(([pattern]) => pattern.test(text)).map(([, label]) => `contains ${label}`),
  ]
}

/**
 * The moment in UTC and in the scenario's own time zone, including whether
 * daylight saving applies then, so time claims in the copy can be checked.
 */
export function timeFacts(target: string, timeZone: string | undefined): string[] {
  const instant = new Date(target)
  const facts = [`The moment is ${instant.toISOString().replace('.000Z', 'Z')} in UTC.`]
  if (!timeZone) return facts
  const offsetAt = (date: Date) => {
    const name = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' }).formatToParts(date).find((p) => p.type === 'timeZoneName')?.value
    // "GMT" alone means an offset of zero.
    const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name ?? '')
    if (!match) return 0
    return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]))
  }
  const year = instant.getUTCFullYear()
  const january = offsetAt(new Date(Date.UTC(year, 0, 15)))
  const july = offsetAt(new Date(Date.UTC(year, 6, 15)))
  const local = new Intl.DateTimeFormat('en-US', { timeZone, dateStyle: 'full', timeStyle: 'long' }).format(instant)
  const season =
    january === july ? `${timeZone} doesn't observe daylight saving time`
    : offsetAt(instant) > Math.min(january, july) ? 'daylight saving time is in effect then'
    : 'standard time is in effect then, not daylight saving time'
  facts.push(`In ${timeZone} it is ${local}; ${season}.`)
  return facts
}
