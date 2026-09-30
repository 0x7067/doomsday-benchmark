import { memo } from 'react'
import styles from './Countdown.module.css'
import { pad2, pad3, toIsoDuration } from '../lib/time.ts'
import type { Remaining } from '../lib/time.ts'

interface Props {
  remaining: Remaining
  label: string
}

function CountdownImpl({ remaining, label }: Props) {
  const units = [
    { key: 'days', value: pad3(remaining.days), label: 'Days', width: 'wide' },
    {
      key: 'hours',
      value: pad2(remaining.hours),
      label: 'Hours',
      width: 'narrow',
    },
    {
      key: 'minutes',
      value: pad2(remaining.minutes),
      label: 'Minutes',
      width: 'narrow',
    },
    {
      key: 'seconds',
      value: pad2(remaining.seconds),
      label: 'Seconds',
      width: 'narrow',
    },
  ] as const

  return (
    // The single source of truth for the remaining time, in the machine-readable
    // ISO 8601 duration form. The digits inside are the same number, human-sized.
    <time
      className={styles.root}
      dateTime={toIsoDuration(remaining)}
      aria-label={label}
      data-arrived={remaining.arrived}
    >
      {units.map((unit, index) => (
        <span className={styles.slot} key={unit.key}>
          {index > 0 && (
            <span className={styles.separator} aria-hidden="true">
              :
            </span>
          )}
          <span className={styles.unit} data-unit={unit.key} data-width={unit.width}>
            {/* Re-keyed on the value so each change restarts the tick animation.
                `data-value` keeps the digits machine-readable from the DOM
                without having to parse around the unit labels. */}
            <span
              className={styles.value}
              data-value
              key={`${unit.key}-${unit.value}`}
              data-tick={unit.key === 'seconds'}
            >
              {unit.value}
            </span>
            <span className={styles.unitLabel}>{unit.label}</span>
          </span>
        </span>
      ))}
    </time>
  )
}

export const Countdown = memo(CountdownImpl)
