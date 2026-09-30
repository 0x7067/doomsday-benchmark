import { Fragment, memo } from 'react'
import { pad2, type Countdown as CountdownValue } from '../lib/time'
import styles from './Countdown.module.css'

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
] as const

/** A single glyph. Remounting the face on change replays the stamp animation. */
function Digit({ char }: { char: string }) {
  return (
    <span className={styles.digit}>
      <span className={styles.digitFace} key={char}>
        {char}
      </span>
    </span>
  )
}

function Unit({ value, label }: { value: string; label: string }) {
  return (
    <div className={styles.unit}>
      <span className={styles.value} aria-hidden="true">
        {[...value].map((char, index) => (
          <Digit key={index} char={char} />
        ))}
      </span>
      <span className={styles.label}>{label}</span>
    </div>
  )
}

export const Countdown = memo(function Countdown({ countdown }: { countdown: CountdownValue }) {
  const { days, hours, minutes, seconds, released, isoDuration } = countdown
  const values: Record<(typeof UNITS)[number]['key'], string> = {
    days: String(days),
    hours: pad2(hours),
    minutes: pad2(minutes),
    seconds: pad2(seconds),
  }

  const spoken = released
    ? 'The countdown has ended. Ocarina of Time is available now.'
    : `${days} days, ${hours} hours, ${minutes} minutes and ${seconds} seconds until release`

  return (
    <div className={styles.countdown} data-released={released}>
      <p className={styles.kicker} aria-live="polite">
        <span className="ornament">
          <span className="diamond" />
          <span>{released ? 'Available now' : 'The wait ends in'}</span>
          <span className="diamond" />
        </span>
      </p>

      <time className={styles.clock} dateTime={isoDuration} aria-label={spoken}>
        {UNITS.map((unit, index) => (
          <Fragment key={unit.key}>
            {index > 0 && <span className={styles.sep} key={`${unit.key}-${seconds}`} aria-hidden="true" />}
            <Unit value={values[unit.key]} label={unit.label} />
          </Fragment>
        ))}
      </time>
    </div>
  )
})
