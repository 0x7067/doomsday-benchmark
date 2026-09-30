import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND, RELEASE_TIME_ZONE } from './release.ts'

/** A countdown, already floored into display units and already clamped at zero. */
export interface Remaining {
  /** Milliseconds still to go. Never negative. */
  totalMs: number
  days: number
  hours: number
  minutes: number
  seconds: number
  /** True once the moment has arrived. From here on we hold, we never count down. */
  arrived: boolean
}

const ZERO: Remaining = {
  totalMs: 0,
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  arrived: true,
}

/**
 * Split a duration into days/hours/minutes/seconds.
 *
 * Seconds are *ceiled*, not floored. Rounding up means the display only ever
 * reaches 00:00:00:00 at the exact instant the moment arrives — floor would
 * reveal a premature zero for the last half second of every minute.
 */
export function breakdown(remainingMs: number): Remaining {
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return ZERO

  const totalSeconds = Math.ceil(remainingMs / MS_PER_SECOND)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60

  return { totalMs: remainingMs, days, hours, minutes, seconds, arrived: false }
}

/**
 * ISO 8601 duration, the flavour that carries days — `P37DT11H10M5S`.
 * Empty components are dropped so `PT5S` and `PT0S` stay canonical.
 */
export function toIsoDuration(remaining: Remaining): string {
  if (remaining.arrived) return 'PT0S'

  const { days, hours, minutes, seconds } = remaining
  if (days === 0 && hours === 0 && minutes === 0 && seconds === 0) return 'PT0S'

  const date = days > 0 ? `${days}D` : ''
  const time =
    `${hours > 0 ? `${hours}H` : ''}` +
    `${minutes > 0 ? `${minutes}M` : ''}` +
    `${seconds > 0 ? `${seconds}S` : ''}`

  return `P${date}T${time}`
}

/** `37 days, 11 hours, 10 minutes and 5 seconds` — for screen readers and clipboard. */
export function toSpokenDuration(remaining: Remaining): string {
  if (remaining.arrived) return 'no time remaining'
  const parts: string[] = []
  if (remaining.days > 0) parts.push(`${remaining.days} day${remaining.days === 1 ? '' : 's'}`)
  if (remaining.hours > 0) parts.push(`${remaining.hours} hour${remaining.hours === 1 ? '' : 's'}`)
  if (remaining.minutes > 0) parts.push(`${remaining.minutes} minute${remaining.minutes === 1 ? '' : 's'}`)
  if (remaining.seconds > 0 || parts.length === 0) {
    parts.push(`${remaining.seconds} second${remaining.seconds === 1 ? '' : 's'}`)
  }
  if (parts.length === 1) return parts[0] as string
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1] as string}`
}

/** Two digits, always: `07`. */
export function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value)
}

/** Three digits, always: `037`. Keeps the day column from reflowing as it shrinks. */
export function pad3(value: number): string {
  return value < 10 ? `00${value}` : value < 100 ? `0${value}` : String(value)
}

/** `0.42` -> `42%`. Used for the urgency ramp that heats the whole page up. */
export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return value < 0 ? 0 : value > 1 ? 1 : value
}

/**
 * How close we are to the moment, as 0..1.
 *
 * Not linear across the whole countdown — five months out nothing should look
 * alarmed, so the ramp is mostly spent in the final week and the final hour.
 */
export function urgency(remainingMs: number): number {
  if (remainingMs <= 0) return 1
  const DAY = MS_PER_DAY
  if (remainingMs > 30 * DAY) return clamp01(0.06 * (1 - (remainingMs - 30 * DAY) / (330 * DAY)))
  if (remainingMs > 7 * DAY) return 0.06 + clamp01((30 * DAY - remainingMs) / (23 * DAY)) * 0.24
  if (remainingMs > MS_PER_DAY) return 0.3 + clamp01((7 * DAY - remainingMs) / (6 * DAY)) * 0.3
  if (remainingMs > MS_PER_HOUR) return 0.6 + clamp01((MS_PER_DAY - remainingMs) / (23 * MS_PER_HOUR)) * 0.22
  if (remainingMs > MS_PER_MINUTE)
    return 0.82 + clamp01((MS_PER_HOUR - remainingMs) / (59 * MS_PER_MINUTE)) * 0.12
  return 0.94 + clamp01((MS_PER_MINUTE - remainingMs) / MS_PER_MINUTE) * 0.06
}

/**
 * The moment's own wall clock, read in its own timezone, so the dial's hands
 * always converge on twelve at the gate — whatever timezone the visitor is in.
 *
 * The formatter is built once at module scope: this runs on every animation
 * frame, and constructing an `Intl.DateTimeFormat` sixty times a second is one
 * of the more expensive things you can ask a browser to do.
 */
const ZONE_CLOCK = new Intl.DateTimeFormat('en-GB', {
  timeZone: RELEASE_TIME_ZONE,
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

export function timeOfDayAtMoment(ms: number) {
  const parts = ZONE_CLOCK.formatToParts(new Date(ms))

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  // `en-GB` with hour12:false can emit "24" for midnight in some ICU versions.
  return {
    hours: read('hour') % 24,
    minutes: read('minute'),
    seconds: read('second'),
  }
}

export { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND, RELEASE_TIME_ZONE }
