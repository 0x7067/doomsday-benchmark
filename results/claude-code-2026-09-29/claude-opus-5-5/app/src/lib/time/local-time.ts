const EASTERN = 'America/New_York'

function wallClock(at: number, timeZone: string | undefined): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(at)
}

/**
 * The launch as the visitor's own clock will read it, e.g.
 * "Wed, Nov 4, 9:00 PM PST", or `null` when their clock reads the same as
 * Eastern at that instant (so "midnight ET" already says it all).
 */
export function launchInLocalTime(
  launchAt: number,
  options: { locale?: string; timeZone?: string } = {},
): string | null {
  const { locale, timeZone } = options
  if (wallClock(launchAt, timeZone) === wallClock(launchAt, EASTERN)) return null
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(launchAt)
}
