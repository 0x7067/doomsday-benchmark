import { memo, useRef } from 'react'
import styles from './DoomsdayDial.module.css'
import { useAnimationFrame, useClock } from '../lib/useClock.ts'
import { RELEASE_MS, RELEASE_TIME_ZONE } from '../lib/release.ts'
import { timeOfDayAtMoment } from '../lib/time.ts'

/** Dial geometry, in the 200x200 viewBox. */
const R = {
  bezelOuter: 98,
  bezelMid: 91,
  bezelInner: 84,
  minuteTrack: 79,
  hourTrack: 75,
  numerals: 66,
  apertureY: 166,
  handHour: 44,
  handMinute: 58,
  handSecond: 74,
}

const ROMAN: ReadonlyArray<readonly [hour: number, label: string]> = [
  [1, 'I'],
  [2, 'II'],
  [3, 'III'],
  [4, 'IIII'],
  [5, 'V'],
  // VI is given over to the date aperture, as on a real calendar watch.
  [7, 'VII'],
  [8, 'VIII'],
  [9, 'IX'],
  [10, 'X'],
  [11, 'XI'],
]

/**
 * The Triforce: three of the four triangles an equilateral splits into.
 * Centroid at (100, 34), which is the XII position.
 */
const TRIFORCE = 'M100 22 L94.8 31 L105.2 31 Z M94.8 31 L89.61 40 L100 40 Z M105.2 31 L110.39 40 L100 40 Z'

const { day, month } = (() => {
  const [d = '05', m = 'NOV'] = new Intl.DateTimeFormat('en-GB', {
    timeZone: RELEASE_TIME_ZONE,
    day: '2-digit',
    month: 'short',
  })
    .format(RELEASE_MS)
    .split(' ')
  return { day: d, month: m.toUpperCase() }
})()

function DoomsdayDialImpl({ arrived }: { arrived: boolean }) {
  const clock = useClock()
  const hourRef = useRef<SVGGElement>(null)
  const minuteRef = useRef<SVGGElement>(null)
  const secondRef = useRef<SVGGElement>(null)
  const lastNow = useRef(clock.now())

  useAnimationFrame(() => {
    const now = clock.now()
    // A large jump — a time-travel preset, or a tab that slept for a minute —
    // is animated, so the hands sweep round instead of teleporting.
    const jumped = Math.abs(now - lastNow.current) > 3_000
    lastNow.current = now

    const { hours, minutes, seconds } = timeOfDayAtMoment(now)
    const fraction = seconds + (((now % 1000) + 1000) % 1000) / 1000

    if (hourRef.current) {
      hourRef.current.style.transform = `rotate(${(hours % 12) * 30 + minutes * 0.5 + fraction / 120}deg)`
    }
    if (minuteRef.current) {
      minuteRef.current.style.transform = `rotate(${minutes * 6 + fraction / 10}deg)`
    }
    if (secondRef.current) {
      secondRef.current.style.transform = `rotate(${fraction * 6}deg)`
    }

    if (jumped) {
      for (const hand of [hourRef, minuteRef, secondRef]) {
        const node = hand.current
        if (!node) continue
        node.classList.add(styles.snap!)
        requestAnimationFrame(() => node.classList.remove(styles.snap!))
      }
    }
  })

  const minuteCircumference = 2 * Math.PI * R.minuteTrack
  const hourCircumference = 2 * Math.PI * R.hourTrack

  return (
    <div className={styles.dial} data-arrived={arrived} role="presentation">
      <div className={styles.sunburst} aria-hidden="true" />

      <svg className={styles.dialSvg} viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="bezelFill" x1="0.1" y1="0" x2="0.9" y2="1">
            <stop offset="0" stopColor="#fbf3d8" />
            <stop offset="0.16" stopColor="#c9a24a" />
            <stop offset="0.34" stopColor="#6d4d18" />
            <stop offset="0.5" stopColor="#e3c477" />
            <stop offset="0.68" stopColor="#8a6522" />
            <stop offset="0.85" stopColor="#d9bd72" />
            <stop offset="1" stopColor="#5a4015" />
          </linearGradient>

          <radialGradient id="faceFill" cx="0.38" cy="0.3" r="0.82">
            <stop offset="0" stopColor="#14312a" />
            <stop offset="0.45" stopColor="#0a1a16" />
            <stop offset="1" stopColor="#03080a" />
          </radialGradient>

          <linearGradient id="handGold" x1="0" y1="0" x2="1" y2="0.4">
            <stop offset="0" stopColor="#8a6522" />
            <stop offset="0.3" stopColor="#f2dfa8" />
            <stop offset="0.52" stopColor="#e3c477" />
            <stop offset="1" stopColor="#7a5a1c" />
          </linearGradient>

          <radialGradient id="hubFill" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#fbf3d8" />
            <stop offset="0.6" stopColor="#c9a24a" />
            <stop offset="1" stopColor="#5a4015" />
          </radialGradient>

          <linearGradient id="apertureFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d2c26" />
            <stop offset="1" stopColor="#0a1512" />
          </linearGradient>

          <linearGradient id="arrivalStroke" x1="0.05" y1="0" x2="0.95" y2="1">
            <stop offset="0" stopColor="#fbf3d8" stopOpacity="0" />
            <stop offset="0.38" stopColor="#fbf3d8" stopOpacity="0.85" />
            <stop offset="0.62" stopColor="#b6ffdb" stopOpacity="0.85" />
            <stop offset="1" stopColor="#b6ffdb" stopOpacity="0" />
          </linearGradient>

          {/* userSpaceOnUse is load-bearing: a vertical line has a zero-width
              object bounding box, and a filter on one renders nothing. */}
          <filter id="naviGlow" filterUnits="userSpaceOnUse" x="84" y="18" width="32" height="106">
            <feGaussianBlur stdDeviation="1.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Bezel */}
        <circle
          className={styles.bezelGold}
          cx="100"
          cy="100"
          r={R.bezelMid}
          strokeWidth={R.bezelOuter - R.bezelInner}
        />
        <circle className={styles.bezelEdge} cx="100" cy="100" r={R.bezelOuter - 0.4} />
        <circle className={styles.bezelEdge} cx="100" cy="100" r={R.bezelInner + 0.4} />
        <circle className={styles.bezelInner} cx="100" cy="100" r={R.bezelInner - 0.8} />

        {/* Face */}
        <circle className={styles.face} cx="100" cy="100" r={R.bezelInner - 1.4} />

        {/* Engraved tracks: 60 minute ticks and 12 hour ticks, each one dashed
            circle rotated so the pattern begins at twelve. */}
        <g transform="rotate(-90 100 100)">
          <circle
            className={styles.trackMinute}
            cx="100"
            cy="100"
            r={R.minuteTrack}
            strokeWidth="2.6"
            strokeDasharray={`4.4 ${minuteCircumference / 60 - 4.4}`}
            strokeDashoffset="2.2"
          />
          <circle
            className={styles.trackHour}
            cx="100"
            cy="100"
            r={R.hourTrack}
            strokeWidth="3.4"
            strokeDasharray={`9 ${hourCircumference / 12 - 9}`}
            strokeDashoffset="4.5"
          />
        </g>

        <circle className={styles.hairline} cx="100" cy="100" r="60" />
        <circle className={styles.hairline} cx="100" cy="100" r="44" />
        <circle className={styles.hairline} cx="100" cy="100" r="24" />

        {/* Numerals */}
        <g>
          {ROMAN.map(([hour, label]) => {
            const angle = (hour * 30 * Math.PI) / 180
            return (
              <text
                key={hour}
                className={styles.numeral}
                x={100 + R.numerals * Math.sin(angle)}
                y={100 - R.numerals * Math.cos(angle)}
              >
                {label}
              </text>
            )
          })}
        </g>

        <path className={styles.triforce} d={TRIFORCE} />

        {/* Date aperture at six */}
        <g>
          <rect className={styles.apertureFrame} x="87" y={R.apertureY - 7} width="26" height="14" rx="2.4" />
          <text className={styles.apertureDay} x="100" y={R.apertureY - 1.5}>
            {day}
          </text>
          <text className={styles.apertureMonth} x="100" y={R.apertureY + 4.6}>
            {month}
          </text>
        </g>

        <text className={styles.brand} x="100" y="132">
          GATE OF TIME
        </text>

        {/* Hands */}
        <g ref={hourRef} className={styles.hand}>
          <path
            className={styles.handBody}
            d={`M100 ${100 - R.handHour} l3 8.5 -1.3 33.5 h-3.4 l-1.3 -33.5 z`}
          />
          <path className={styles.handInlay} d={`M100 ${100 - R.handHour + 9} V96`} />
          <circle className={styles.handBody} cx="100" cy="106.5" r="3.6" />
        </g>

        <g ref={minuteRef} className={styles.hand}>
          <path className={styles.handBody} d={`M100 ${100 - R.handMinute} l2.3 8 -1 46 h-2.6 l-1 -46 z`} />
          <path className={styles.minuteInlay} d={`M100 ${100 - R.handMinute + 9} V96`} />
        </g>

        <g ref={secondRef} className={styles.hand}>
          <line className={styles.secondHand} x1="100" y1={100 - R.handSecond} x2="100" y2="97.5" />
          <line className={styles.secondTail} x1="100" y1="102.5" x2="100" y2="112" />
          <circle className={styles.secondTail} cx="100" cy="107.5" r="1.8" />
        </g>

        {/* Hub */}
        <circle className={styles.hub} cx="100" cy="100" r="5.4" />
        <circle className={styles.gem} cx="100" cy="100" r="2.4" />
        <circle className={styles.hubInner} cx="100" cy="100" r="4.2" />

        <circle className={styles.arrivalSweep} cx="100" cy="100" r={R.bezelOuter - 3} />
      </svg>
    </div>
  )
}

export const DoomsdayDial = memo(DoomsdayDialImpl)
