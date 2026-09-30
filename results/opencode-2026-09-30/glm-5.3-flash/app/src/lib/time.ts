/**
 * The moment the clock reaches zero: November 5, 2026, midnight Eastern Time
 * (EST, UTC-05:00 — daylight saving ends the Sunday prior, so -05:00 is correct).
 */
export const TARGET_ISO = '2026-11-05T00:00:00-05:00'
export const TARGET_MS = Date.parse(TARGET_ISO)
export const TARGET_LABEL = 'November 5, 2026 · Midnight ET'

export interface Remaining {
  readonly days: number
  readonly hours: number
  readonly minutes: number
  readonly seconds: number
  /** True once the target moment has passed. */
  readonly released: boolean
}

/**
 * Whole seconds between `nowMs` and the target, rounded up so a remaining
 * fraction of a second still reads as "1 second left" until it is truly gone.
 * Never negative.
 */
export function remainingTo(nowMs: number, targetMs: number = TARGET_MS): Remaining {
  const totalSeconds = Math.max(0, Math.ceil((targetMs - nowMs) / 1000))
  return {
    days: Math.floor(totalSeconds / 86_400),
    hours: Math.floor((totalSeconds % 86_400) / 3_600),
    minutes: Math.floor((totalSeconds % 3_600) / 60),
    seconds: totalSeconds % 60,
    released: targetMs - nowMs <= 0,
  }
}

/**
 * ISO 8601 duration for the remaining time, e.g. `P37DT11H10M5S`.
 * Leading zero units are suppressed (`PT11H10M5S`), and the zero point is
 * exactly `PT0S`. Once a unit appears, all smaller units are kept so the
 * string stays unambiguous (`PT5M0S`, not `PT5M`).
 */
export function formatISODuration(r: Remaining): string {
  const { days, hours, minutes, seconds } = r
  if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) return 'PT0S'
  if (days === 0) {
    if (hours > 0) return `PT${hours}H${minutes}M${seconds}S`
    if (minutes > 0) return `PT${minutes}M${seconds}S`
    return `PT${seconds}S`
  }
  return `P${days}DT${hours}H${minutes}M${seconds}S`
}

/** Accessible sentence form, e.g. "37 days, 11 hours, 10 minutes, 5 seconds". */
export function describeRemaining(r: Remaining): string {
  return [
    `${r.days} ${r.days === 1 ? 'day' : 'days'}`,
    `${r.hours} ${r.hours === 1 ? 'hour' : 'hours'}`,
    `${r.minutes} ${r.minutes === 1 ? 'minute' : 'minutes'}`,
    `${r.seconds} ${r.seconds === 1 ? 'second' : 'seconds'}`,
  ].join(', ')
}

export interface SimulatedClock {
  /** Offset subtracted from the real clock: simNow = Date.now() - offsetMs. */
  readonly offsetMs: number
  /** The raw query parameter as typed. */
  readonly value: string
}

/**
 * Reads `?now=<ISO 8601>` from a query string and returns the fixed offset
 * that makes the page behave as if it loaded at that instant. Returns null
 * when the parameter is absent or not parseable as a date.
 */
export function parseSimulatedNow(search: string): SimulatedClock | null {
  const raw = new URLSearchParams(search).get('now')?.trim()
  if (!raw) return null
  const ms = Date.parse(raw)
  if (Number.isNaN(ms)) return null
  return { offsetMs: Date.now() - ms, value: raw }
}
