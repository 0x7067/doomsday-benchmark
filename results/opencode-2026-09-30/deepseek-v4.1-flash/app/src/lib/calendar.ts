/**
 * Front-end-only "add to calendar": builds an .ics file in memory and hands it
 * to the browser as a download. No network, no backend.
 */
import { RELEASE_ISO } from './time'

const EVENT_TITLE = 'The Legend of Zelda: Ocarina of Time — out now'
const EVENT_DESCRIPTION =
  'The Ocarina of Time remake arrives on Nintendo Switch 2. The countdown has ended — Hyrule is waiting.'

const ICS_START = '20261105T050000Z' // midnight Eastern Time
const ICS_END = '20261105T060000Z'

export function buildIcs(): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ocarina of Time Countdown//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:ocarina-of-time-remake-${RELEASE_ISO.replace(/[^0-9]/g, '')}@countdown`,
    'DTSTAMP:20260101T000000Z',
    `DTSTART:${ICS_START}`,
    `DTEND:${ICS_END}`,
    `SUMMARY:${EVENT_TITLE}`,
    `DESCRIPTION:${EVENT_DESCRIPTION}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}

/** Triggers a download of the calendar file. */
export function downloadIcs(): void {
  const blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'ocarina-of-time-remake.ics'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export type ShareOutcome = 'shared' | 'copied' | 'failed'

/** Native share sheet where available, clipboard otherwise. */
export async function shareCountdown(): Promise<ShareOutcome> {
  const url = window.location.href
  const data = {
    title: 'Ocarina of Time — countdown to launch',
    text: 'Midnight, November 5, 2026. The legend returns on Nintendo Switch 2.',
    url,
  }

  if (navigator.share) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared'
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
