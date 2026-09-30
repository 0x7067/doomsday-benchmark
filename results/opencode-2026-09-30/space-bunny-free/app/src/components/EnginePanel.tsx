import { useCallback, useEffect, useState } from 'react'
import type { VirtualClock } from '../lib/clock.ts'
import { useClock } from '../lib/useClock.ts'
import { RELEASE_ISO, RELEASE_MS } from '../lib/release.ts'
import { MS_PER_DAY, MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND } from '../lib/time.ts'
import styles from './EnginePanel.module.css'

/** How far back and forward the scrubber can reach, in milliseconds of countdown. */
const SCRUB_MIN = -MS_PER_HOUR
const SCRUB_MAX = MS_PER_DAY

interface Preset {
  id: string
  label: string
  note: string
  /** Signed milliseconds of countdown left: negative is past the moment. */
  remainingMs: number
}

const PRESETS: readonly Preset[] = [
  { id: 'day', label: '−1 day', note: 'a day out', remainingMs: MS_PER_DAY },
  { id: 'hour', label: '−1 hour', note: 'an hour out', remainingMs: MS_PER_HOUR },
  { id: 'ten', label: '−10 min', note: 'ten minutes out', remainingMs: 10 * MS_PER_MINUTE },
  { id: 'thirty', label: '−30 sec', note: 'thirty seconds out', remainingMs: 30 * MS_PER_SECOND },
  { id: 'ten-after', label: '+10 sec', note: 'just past zero', remainingMs: -10 * MS_PER_SECOND },
  { id: 'after', label: '+1 hour', note: 'an hour past', remainingMs: -MS_PER_HOUR },
]

/** Loaded from a share link rather than the real timeline? Say so, once. */
const PINNED_AT_LOAD = (() => {
  try {
    return new URLSearchParams(window.location.search).has('now')
  } catch {
    return false
  }
})()

/**
 * Move the clock so that exactly `remainingMs` are left before the moment.
 *
 * Everything on the page — digits, hands, palette ramp, arrival state, the
 * live region — is downstream of the same clock object, so a jump exercises
 * precisely the code path real time would. The URL is never touched.
 */
function seekToRemaining(clock: VirtualClock, remainingMs: number): void {
  const onRealTimeline = clock.now() - clock.travel()
  clock.setTravel(RELEASE_MS - onRealTimeline - remainingMs)
}

/** Milliseconds of countdown currently showing, from the clock's own view. */
function remainingFrom(clock: VirtualClock): number {
  return clock.targetMs - clock.now()
}

/**
 * The engine room.
 *
 * A countdown you cannot see the end of is a poster. This is the panel that
 * lets you watch midnight land without waiting five weeks for it.
 */
export function EnginePanel() {
  const clock = useClock()

  // The thumb follows the live clock, so the control never lies about where
  // the countdown currently is. It is quantised to whole seconds and only
  // re-renders when it would actually move.
  const [thumb, setThumb] = useState(() =>
    clampToScrub(Math.round(remainingFrom(clock) / MS_PER_SECOND) * MS_PER_SECOND),
  )
  const [simulated, setSimulated] = useState(() => clock.isSimulated())

  useEffect(
    () =>
      clock.subscribe(() => {
        const live = clampToScrub(Math.round(remainingFrom(clock) / MS_PER_SECOND) * MS_PER_SECOND)
        setThumb((previous) => (Math.abs(previous - live) > 1500 ? live : previous))
      }),
    [clock],
  )

  const seek = useCallback(
    (remainingMs: number) => {
      seekToRemaining(clock, remainingMs)
      setThumb(clampToScrub(Math.round(remainingMs / MS_PER_SECOND) * MS_PER_SECOND))
      setSimulated(true)
    },
    [clock],
  )

  const returnToNow = useCallback(() => {
    clock.setTravel(0)
    setThumb(clampToScrub(Math.round(remainingFrom(clock) / MS_PER_SECOND) * MS_PER_SECOND))
    setSimulated(clock.isSimulated())
  }, [clock])

  return (
    <section className={styles.panel} aria-labelledby="engine-heading">
      <div className={styles.head}>
        <h2 id="engine-heading" className={styles.title}>
          The engine room
        </h2>
        <p className={styles.blurb}>
          A live countdown is a promise you can only check by waiting. These move the clock's own timeline, so
          the digits, the hands and the arrival state all run exactly the code they run in real time. Nothing
          here touches the URL.
        </p>
      </div>

      <div className={styles.presets} role="group" aria-label="Jump the clock">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={styles.preset}
            onClick={() => seek(preset.remainingMs)}
          >
            <span className={styles.presetLabel}>{preset.label}</span>
            <span className={styles.presetNote}>{preset.note}</span>
          </button>
        ))}
      </div>

      <div className={styles.row}>
        <label className={styles.slider} htmlFor="scrub">
          <span className={styles.sliderLabel}>Scrub the last day</span>
          <input
            id="scrub"
            className={styles.range}
            type="range"
            min={SCRUB_MIN}
            max={SCRUB_MAX}
            step={MS_PER_SECOND}
            value={thumb}
            onChange={(event) => seek(Number(event.target.value))}
            aria-valuetext={describeRemaining(thumb)}
          />
          <span className={styles.sliderValue}>{describeRemaining(thumb)}</span>
        </label>

        <div className={styles.jump}>
          <button type="button" className={styles.primary} onClick={() => seek(0)}>
            Go to midnight
          </button>
          <button type="button" className={styles.secondary} onClick={returnToNow}>
            Back to real time
          </button>
        </div>
      </div>

      <p className={styles.state} data-simulated={simulated ? 'true' : 'false'}>
        {simulated
          ? PINNED_AT_LOAD
            ? 'This page loaded from a ?now= parameter, so the timeline was pinned before the panel was ever touched.'
            : 'Previewing. The clock is displaced from the real timeline — scrub, jump or reset at any time.'
          : 'Running on real time.'}
      </p>

      <p className={styles.reference}>
        Target <code>{RELEASE_ISO}</code> &nbsp;·&nbsp; {RELEASE_MS} ms since the epoch
      </p>

      <p className="visually-hidden" role="status">
        {simulated ? `Preview: ${describeRemaining(thumb)} left.` : ''}
      </p>
    </section>
  )
}

function clampToScrub(value: number): number {
  if (!Number.isFinite(value)) return SCRUB_MAX
  return value < SCRUB_MIN ? SCRUB_MIN : value > SCRUB_MAX ? SCRUB_MAX : value
}

function describeRemaining(remainingMs: number): string {
  if (remainingMs <= 0) return 'at or past midnight'
  const total = Math.round(remainingMs / MS_PER_SECOND)
  const days = Math.floor(total / 86_400)
  const hours = Math.floor((total % 86_400) / 3_600)
  const minutes = Math.floor((total % 3_600) / 60)
  const seconds = total % 60

  const parts: string[] = []
  if (days) parts.push(`${days} day${days === 1 ? '' : 's'}`)
  if (hours) parts.push(`${hours} hour${hours === 1 ? '' : 's'}`)
  if (minutes) parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  if (seconds || parts.length === 0) parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`)

  return `${parts.join(' ')} left`
}
