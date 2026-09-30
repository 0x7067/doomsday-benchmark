import { useState } from 'react'
import { describeRemaining, formatISODuration } from '../lib/time'
import type { Remaining } from '../lib/time'

/**
 * One glyph of the countdown. When its character changes, the new digit is
 * remounted (via key) so a short "stamp" animation plays — the only node
 * that animates is the one that actually changed.
 */
function Digit({ char }: { char: string }) {
  const [current, setCurrent] = useState(char)
  const [stamp, setStamp] = useState(0)
  if (current !== char) {
    setCurrent(char)
    setStamp(stamp + 1)
  }
  return (
    <span className="digit-slot">
      <span key={stamp} className={stamp === 0 ? 'digit' : 'digit is-rolling'}>
        {char}
      </span>
    </span>
  )
}

function DigitGroup({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, '0')
  return (
    <span className="countdown-group">
      <span className="countdown-digits">
        {Array.from(text, (char, index) => (
          <Digit key={index} char={char} />
        ))}
      </span>
      <span className="countdown-label" aria-hidden="true">
        {label}
      </span>
    </span>
  )
}

const Colon = () => (
  <span className="countdown-colon" aria-hidden="true">
    :
  </span>
)

/**
 * The live countdown. Exactly one <time> element; its datetime attribute is
 * the remaining ISO 8601 duration, rewritten on every tick.
 */
export function Countdown({ value, released }: { value: Remaining; released: boolean }) {
  return (
    <time
      className={released ? 'countdown is-released' : 'countdown'}
      dateTime={formatISODuration(value)}
      aria-label={
        released ? 'The wait is over — out now' : `${describeRemaining(value)} remaining`
      }
    >
      <DigitGroup value={value.days} label={value.days === 1 ? 'day' : 'days'} />
      <Colon />
      <DigitGroup value={value.hours} label={value.hours === 1 ? 'hour' : 'hours'} />
      <Colon />
      <DigitGroup value={value.minutes} label={value.minutes === 1 ? 'minute' : 'minutes'} />
      <Colon />
      <DigitGroup value={value.seconds} label={value.seconds === 1 ? 'second' : 'seconds'} />
    </time>
  )
}
