/**
 * Countdown time model.
 *
 * The release instant is fixed: November 5, 2026 at midnight Eastern Time.
 * `?now=<ISO 8601>` lets the page pretend it loaded at another instant; from
 * there the clock keeps ticking against real elapsed time.
 */

export const RELEASE_ISO = '2026-11-05T00:00:00-05:00'

/** Milliseconds since the epoch for the release instant. */
export const RELEASE_MS = Date.parse(RELEASE_ISO)

export type TimeUnits = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export type Countdown = TimeUnits & {
  /** Whole seconds remaining, never negative. */
  totalSeconds: number
  /** True once the release instant has been reached. */
  released: boolean
  /** ISO 8601 duration of the remaining time, e.g. `P37DT11H10M5S`. */
  isoDuration: string
}

/** Reads a `?now=` override from a query string. Returns null when absent or invalid. */
export function parseNowParam(search: string): number | null {
  const raw = new URLSearchParams(search).get('now')
  if (!raw) return null
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? null : parsed
}

/** Splits a whole number of seconds into days, hours, minutes and seconds. */
export function splitSeconds(totalSeconds: number): TimeUnits {
  const safe = Math.max(0, Math.floor(totalSeconds))
  return {
    days: Math.floor(safe / 86_400),
    hours: Math.floor((safe % 86_400) / 3_600),
    minutes: Math.floor((safe % 3_600) / 60),
    seconds: safe % 60,
  }
}

/**
 * Formats remaining time as an ISO 8601 duration.
 *
 * Every unit is always written out — `P37DT11H10M5S`, `P0DT0H0M10S` — except
 * at zero, which is the canonical `PT0S`.
 */
export function formatIsoDuration(units: TimeUnits): string {
  const { days, hours, minutes, seconds } = units
  if (days + hours + minutes + seconds === 0) return 'PT0S'
  return `P${days}DT${hours}H${minutes}M${seconds}S`
}

/** Builds the countdown snapshot for an instant in (virtual) time. */
export function countdownAt(nowMs: number, targetMs: number = RELEASE_MS): Countdown {
  const remainingMs = Math.max(0, targetMs - nowMs)
  // Ceiling so a freshly loaded `?now=…:50` reads 10, not 9, and so the clock
  // only shows 00 when the instant has truly passed.
  const totalSeconds = Math.ceil(remainingMs / 1000)
  const units = splitSeconds(totalSeconds)
  return {
    ...units,
    totalSeconds,
    released: totalSeconds <= 0,
    isoDuration: formatIsoDuration(units),
  }
}

/** Two-digit padding for hours, minutes and seconds. */
export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

const LOCAL_FORMAT = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
})

/**
 * Human-readable local time of the release instant, e.g. "Thu, Nov 5, 10:00 AM GMT+1".
 * Returns null when the visitor's zone already matches Eastern Time, since the
 * hero already states the date in ET.
 */
export function localReleaseLabel(timeZone: string): string | null {
  if (/^America\/(New_York|Toronto|Detroit|Kentucky\/Monticello|Indiana\/Petersburg)$/.test(timeZone)) {
    return null
  }
  return LOCAL_FORMAT.format(new Date(RELEASE_MS))
}
