export interface DurationParts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Splits a whole, non-negative number of seconds into calendar-free units. */
export function splitSeconds(totalSeconds: number): DurationParts {
  const total = Math.max(0, Math.floor(totalSeconds))
  return {
    days: Math.floor(total / DAY),
    hours: Math.floor((total % DAY) / HOUR),
    minutes: Math.floor((total % HOUR) / MINUTE),
    seconds: total % MINUTE,
  }
}

/**
 * ISO 8601 duration for the `<time datetime>` attribute.
 *
 * While time remains, every unit is spelled out (`P0DT0H0M9S`) so the shape
 * never changes from tick to tick; once the moment arrives it is `PT0S`.
 */
export function toIsoDuration(totalSeconds: number): string {
  const { days, hours, minutes, seconds } = splitSeconds(totalSeconds)
  if (days + hours + minutes + seconds === 0) return 'PT0S'
  return `P${days}DT${hours}H${minutes}M${seconds}S`
}

const UNIT_NAMES: Record<keyof DurationParts, [singular: string, plural: string]> = {
  days: ['day', 'days'],
  hours: ['hour', 'hours'],
  minutes: ['minute', 'minutes'],
  seconds: ['second', 'seconds'],
}

/** Human phrasing for assistive tech, e.g. "37 days, 10 minutes and 5 seconds". */
export function describeDuration(totalSeconds: number): string {
  const parts = splitSeconds(totalSeconds)
  const phrases = (Object.keys(UNIT_NAMES) as (keyof DurationParts)[])
    .filter((unit) => parts[unit] > 0)
    .map((unit) => `${parts[unit]} ${UNIT_NAMES[unit][parts[unit] === 1 ? 0 : 1]}`)
  if (phrases.length === 0) return '0 seconds'
  if (phrases.length === 1) return phrases[0]
  return `${phrases.slice(0, -1).join(', ')} and ${phrases.at(-1)}`
}
