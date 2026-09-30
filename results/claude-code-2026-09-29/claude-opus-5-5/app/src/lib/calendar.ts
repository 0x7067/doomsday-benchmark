/**
 * A minimal RFC 5545 calendar file for the launch, generated in the browser
 * so "Add to calendar" works offline and without any service.
 */
export interface CalendarEvent {
  uid: string
  start: number
  durationMinutes: number
  title: string
  description: string
  /** Minutes before `start` to remind. */
  alarmMinutes?: number
}

function utcStamp(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
}

const encoder = new TextEncoder()

/** Content lines longer than 75 octets are folded onto continuation lines that start with a space. */
function fold(line: string): string {
  const out: string[] = []
  let current = ''
  for (const char of line) {
    const limit = out.length === 0 ? 75 : 74
    if (encoder.encode(current + char).length > limit) {
      out.push(current)
      current = char
    } else {
      current += char
    }
  }
  out.push(current)
  return out.join('\r\n ')
}

export function buildIcs(event: CalendarEvent, now: number = Date.now()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hyrule Countdown//Ocarina of Time//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(event.start)}`,
    `DTEND:${utcStamp(event.start + event.durationMinutes * 60_000)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    ...(event.alarmMinutes === undefined
      ? []
      : [
          'BEGIN:VALARM',
          'ACTION:DISPLAY',
          `TRIGGER:-PT${event.alarmMinutes}M`,
          `DESCRIPTION:${escapeText(event.title)}`,
          'END:VALARM',
        ]),
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return `${lines.map(fold).join('\r\n')}\r\n`
}
