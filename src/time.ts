const ISO_DURATION =
  /^P(?:(\d+(?:\.\d+)?)W)?(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/

/**
 * Parses an ISO 8601 duration made of weeks, days, hours, minutes and seconds
 * (`P37DT11H10M5S`) into seconds. Years and months are rejected because their
 * length is ambiguous. Returns null for anything that isn't such a duration.
 */
export function parseIsoDuration(value: string): number | null {
  const text = value.trim()
  const match = ISO_DURATION.exec(text)
  // The pattern makes every component optional, so reject the empty forms.
  if (!match || text === 'P' || text.endsWith('T')) return null
  const [weeks, days, hours, minutes, seconds] = match.slice(1).map((part) => Number(part ?? 0))
  return (((weeks * 7 + days) * 24 + hours) * 60 + minutes) * 60 + seconds
}

export function formatIsoDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(s / 86_400)
  const hours = Math.floor((s % 86_400) / 3_600)
  const minutes = Math.floor((s % 3_600) / 60)
  const seconds = s % 60
  const date = days ? `${days}D` : ''
  const time = [hours && `${hours}H`, minutes && `${minutes}M`, seconds && `${seconds}S`].filter(Boolean).join('')
  if (!date && !time) return 'PT0S'
  return `P${date}${time ? `T${time}` : ''}`
}

/** Offset in minutes east of UTC declared by an ISO timestamp (`Z` is 0). */
export function offsetMinutesOf(isoTimestamp: string): number {
  const match = /([+-])(\d{2}):(\d{2})$/.exec(isoTimestamp)
  if (!match) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3])
  return match[1] === '-' ? -minutes : minutes
}

/** Formats `date` as an ISO timestamp in a fixed UTC offset, e.g. `2026-11-04T23:59:50-05:00`. */
export function formatWithOffset(date: Date, offsetMinutes: number): string {
  const local = new Date(date.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 19)
  if (offsetMinutes === 0) return `${local}Z`
  const sign = offsetMinutes < 0 ? '-' : '+'
  const abs = Math.abs(offsetMinutes)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${local}${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}
