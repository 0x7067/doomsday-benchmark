/**
 * Pure time math for the countdown. Nothing in here touches React, the DOM or
 * the real clock, so every function is trivially testable.
 */

/** Launch: midnight Eastern on November 5, 2026 (EST, UTC-5). */
export const LAUNCH_ISO = '2026-11-05T00:00:00-05:00'
export const LAUNCH_MS = Date.parse(LAUNCH_ISO)

export interface Remaining {
  /** Whole seconds left, rounded up so the display hits 0 exactly at launch. */
  totalSeconds: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Splits the time between `nowMs` and `targetMs` into display units. Never negative. */
export function remainingUntil(nowMs: number, targetMs: number = LAUNCH_MS): Remaining {
  const totalSeconds = Math.max(0, Math.ceil((targetMs - nowMs) / 1000))
  return {
    totalSeconds,
    days: Math.floor(totalSeconds / DAY),
    hours: Math.floor((totalSeconds % DAY) / HOUR),
    minutes: Math.floor((totalSeconds % HOUR) / MINUTE),
    seconds: totalSeconds % MINUTE,
  }
}

/**
 * ISO 8601 duration for a `<time datetime>` attribute, always spelled out in
 * days, hours, minutes and seconds (e.g. `P37DT11H10M5S`). Zero is `PT0S`.
 */
export function toIsoDuration({ totalSeconds, days, hours, minutes, seconds }: Remaining): string {
  if (totalSeconds === 0) return 'PT0S'
  return `P${days}DT${hours}H${minutes}M${seconds}S`
}

/** Short human label used in the tab title and for screen readers. */
export function toSpokenDuration({ days, hours, minutes, seconds }: Remaining): string {
  const part = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`
  return [part(days, 'day'), part(hours, 'hour'), part(minutes, 'minute'), part(seconds, 'second')].join(', ')
}

export const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * Reads the `?now=` override. Returns the offset (ms) to add to the real clock
 * so the page behaves as if it loaded at that instant, or 0 when the parameter
 * is absent or not a parseable timestamp.
 */
export function clockOffsetFromSearch(search: string, realNowMs: number): number {
  const raw = new URLSearchParams(search).get('now')
  if (!raw) return 0
  // URLSearchParams turns a literal "+" into a space; put it back so
  // offsets like `+02:00` survive being typed into the address bar unencoded.
  const parsed = Date.parse(raw.trim().replace(' ', '+'))
  return Number.isFinite(parsed) ? parsed - realNowMs : 0
}

/**
 * Milliseconds until the displayed second next changes. Aligning the timer to
 * the countdown's own second boundary (rather than firing every 1000ms from
 * whenever the page loaded) keeps the numbers from drifting or skipping.
 */
export function msUntilNextTick(nowMs: number, targetMs: number = LAUNCH_MS): number {
  const remainder = (targetMs - nowMs) % 1000
  // remainder is negative after launch; tick once a second regardless.
  return remainder > 0 ? remainder : 1000 + remainder || 1000
}
