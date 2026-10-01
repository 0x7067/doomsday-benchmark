/** Builds an .ics file for "Add to calendar", generated locally so it works offline. */
import { LAUNCH_MS } from './countdown'

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

export function launchEvent(nowMs: number = Date.now()): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ocarina of Time Countdown//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    'UID:oot-remake-launch-2026-11-05@countdown',
    `DTSTAMP:${stamp(nowMs)}`,
    `DTSTART:${stamp(LAUNCH_MS)}`,
    `DTEND:${stamp(LAUNCH_MS + 60 * 60 * 1000)}`,
    'SUMMARY:The Legend of Zelda: Ocarina of Time launches on Nintendo Switch 2',
    'DESCRIPTION:Grab your ocarina. The remake is out at midnight Eastern.',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Ocarina of Time launches in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

export function downloadLaunchEvent(): void {
  const blob = new Blob([launchEvent()], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'ocarina-of-time-launch.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
