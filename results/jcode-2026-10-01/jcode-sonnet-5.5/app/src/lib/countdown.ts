/** The moment the clock hits zero: midnight Eastern, 5 November 2026. */
export const RELEASE_ISO = '2026-11-05T00:00:00-05:00'
export const RELEASE_MS = Date.parse(RELEASE_ISO)

export interface Parts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/**
 * Reads the `?now=<ISO 8601>` override. A literal `+` in a query string decodes
 * to a space (`...T23:59:50+05:00` arrives as `...T23:59:50 05:00`), so that is
 * repaired before parsing. Returns epoch milliseconds, or null if absent or invalid.
 */
export function parseNowParam(search: string): number | null {
  const raw = new URLSearchParams(search).get('now')
  if (!raw) return null
  const repaired = raw.trim().replace(/(\d) (\d{2}:?\d{2})$/, '$1+$2')
  const ms = Date.parse(repaired)
  return Number.isFinite(ms) ? ms : null
}

/** Whole seconds left, rounded up so the display flips to 0 exactly at the moment. Never negative. */
export function remainingSeconds(nowMs: number, targetMs = RELEASE_MS): number {
  return Math.max(0, Math.ceil((targetMs - nowMs) / 1000))
}

/** Milliseconds until the displayed whole-second value next changes. */
export function msUntilNextTick(nowMs: number, targetMs = RELEASE_MS): number {
  const left = targetMs - nowMs
  if (left <= 0) return 0
  return left % 1000 || 1000
}

export function splitSeconds(total: number): Parts {
  const t = Math.max(0, Math.floor(total))
  return {
    days: Math.floor(t / 86400),
    hours: Math.floor((t % 86400) / 3600),
    minutes: Math.floor((t % 3600) / 60),
    seconds: t % 60,
  }
}

/** ISO 8601 duration in days, hours, minutes and seconds, e.g. `P37DT11H10M5S`. Zero is `PT0S`. */
export function toIsoDuration(total: number): string {
  if (total <= 0) return 'PT0S'
  const { days, hours, minutes, seconds } = splitSeconds(total)
  return `P${days}DT${hours}H${minutes}M${seconds}S`
}

export type Phase = 'far' | 'week' | 'day' | 'hour' | 'minute' | 'final' | 'zero'

export function phaseFor(total: number): Phase {
  if (total <= 0) return 'zero'
  if (total <= 10) return 'final'
  if (total <= 60) return 'minute'
  if (total <= 3600) return 'hour'
  if (total <= 86400) return 'day'
  if (total <= 7 * 86400) return 'week'
  return 'far'
}

/**
 * 0 (far away) to 1 (zero). Logarithmic, so the dread builds slowly for weeks
 * then quickly in the last hour.
 */
export function tensionFor(total: number): number {
  if (total <= 0) return 1
  const horizon = Math.log(1 + 45 * 86400)
  return Math.min(1, Math.max(0, 1 - Math.log(1 + total) / horizon))
}

export const pad2 = (n: number) => String(n).padStart(2, '0')
