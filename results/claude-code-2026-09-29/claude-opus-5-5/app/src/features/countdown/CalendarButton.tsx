import { GAME_TITLE, LAUNCH_AT, PLATFORM } from '../../config/launch'
import { buildIcs } from '../../lib/calendar'
import './calendar-button.css'

/** Downloads an .ics file for the launch. `compact` is the icon-only version for the phone top bar. */
export function CalendarButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      type="button"
      className="calendar-button"
      data-compact={compact || undefined}
      aria-label={compact ? 'Add to calendar' : undefined}
      onClick={downloadCalendarFile}
    >
      <CalendarIcon />
      {!compact && 'Add to calendar'}
    </button>
  )
}

function downloadCalendarFile() {
  const ics = buildIcs({
    uid: 'ocarina-of-time-switch-2-launch@hyrule-countdown',
    start: LAUNCH_AT,
    durationMinutes: 60,
    title: `${GAME_TITLE} launches on ${PLATFORM}`,
    description: 'The Hero of Time returns. Midnight Eastern, November 5, 2026.',
    alarmMinutes: 15,
  })
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: 'ocarina-of-time-launch.ics' })
  link.click()
  // Give the browser a beat to start the download before releasing the blob.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <rect x="2.75" y="4" width="14.5" height="13" rx="2.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.75 8.25h14.5M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 10.2l.9 1.9 2 .2-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.2z" fill="currentColor" />
    </svg>
  )
}
