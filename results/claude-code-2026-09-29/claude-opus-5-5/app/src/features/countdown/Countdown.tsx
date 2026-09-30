import { Fragment, type CSSProperties } from 'react'
import { splitSeconds, type DurationParts } from '../../lib/time/duration'
import { RollingDigit } from './RollingDigit'
import './countdown.css'

const UNITS: { unit: keyof DurationParts; label: string }[] = [
  { unit: 'days', label: 'Days' },
  { unit: 'hours', label: 'Hours' },
  { unit: 'minutes', label: 'Minutes' },
  { unit: 'seconds', label: 'Seconds' },
]

interface CountdownProps {
  /** Whole seconds remaining; always > 0 while this is on screen. */
  seconds: number
}

/**
 * The visible clock. Purely presentational and hidden from assistive tech:
 * the page's single `<time>` element (see `RemainingTime`) carries the value.
 */
export function Countdown({ seconds }: CountdownProps) {
  const parts = splitSeconds(seconds)
  const dayDigits = Math.max(2, String(parts.days).length)
  let glyphIndex = 0

  return (
    <div
      className="countdown"
      aria-hidden="true"
      data-final={seconds <= 10 || undefined}
      style={{ '--glyphs': dayDigits + 6 } as CSSProperties}
    >
      {UNITS.map(({ unit, label }, i) => {
        const digits = String(parts[unit]).padStart(unit === 'days' ? dayDigits : 2, '0').split('')
        return (
          <Fragment key={unit}>
            {i > 0 && <Separator tick={seconds} />}
            <div className="countdown__unit" data-unit={unit}>
              <span className="countdown__value">
                {digits.map((digit, d) => (
                  // Keyed from the right so a unit keeps its slots when days drop from 100 to 99.
                  <RollingDigit key={digits.length - d} value={digit} index={glyphIndex++} />
                ))}
              </span>
              <span className="countdown__label">{label}</span>
            </div>
          </Fragment>
        )
      })}
    </div>
  )
}

function Separator({ tick }: { tick: number }) {
  return (
    <span className="countdown__separator">
      {/* Re-keyed every second so the pulse restarts on the tick. */}
      <span key={tick} className="countdown__pips" />
    </span>
  )
}
