import { RELEASE_MS } from './countdown'

/**
 * Describes the moment in the visitor's own time zone, or null when that is
 * already midnight on 5 November (i.e. they are on Eastern time).
 */
export function localReleaseLabel(zone?: string): string | null {
  const opts: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: zone,
  }
  const at = new Date(RELEASE_MS)
  const local = new Intl.DateTimeFormat('en-US', opts).format(at)
  const eastern = new Intl.DateTimeFormat('en-US', { ...opts, timeZone: 'America/New_York' }).format(at)
  if (local === eastern) return null
  const zoneName = new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone: zone })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName')?.value
  return `${local}${zoneName ? ` ${zoneName}` : ''}`
}
