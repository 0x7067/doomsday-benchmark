import { describe, expect, it } from 'vitest'
import { buildIcs } from './calendar'

const event = {
  uid: 'launch@example',
  start: Date.parse('2026-11-05T00:00:00-05:00'),
  durationMinutes: 60,
  title: 'Ocarina of Time, out now',
  description: 'Midnight ET; bring a fairy',
  alarmMinutes: 15,
}

describe('buildIcs', () => {
  const ics = buildIcs(event, Date.parse('2026-09-29T12:00:00Z'))

  it('uses UTC timestamps and CRLF line endings', () => {
    expect(ics).toContain('DTSTART:20261105T050000Z\r\n')
    expect(ics).toContain('DTEND:20261105T060000Z\r\n')
    expect(ics).toContain('DTSTAMP:20260929T120000Z\r\n')
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  })

  it('escapes text values', () => {
    expect(ics).toContain('SUMMARY:Ocarina of Time\\, out now')
    expect(ics).toContain('DESCRIPTION:Midnight ET\\; bring a fairy')
  })

  it('adds a reminder', () => {
    expect(ics).toContain('TRIGGER:-PT15M')
  })

  it('folds long lines at 75 octets without splitting characters', () => {
    const description = 'Ocarina — '.repeat(20)
    const long = buildIcs({ ...event, description })
    const lines = long.split('\r\n')
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75)
    expect(lines.some((line) => line.startsWith(' '))).toBe(true)
    // Unfolding (RFC 5545 §3.1) restores the original value, em dashes intact.
    expect(long.replace(/\r\n /g, '')).toContain(`DESCRIPTION:${description}\r\n`)
  })
})
