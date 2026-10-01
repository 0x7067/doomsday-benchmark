import { Fragment, memo } from 'react'
import { pad2, toIsoDuration, toSpokenDuration, type Remaining } from '../lib/countdown'

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
] as const

/**
 * The clock. This is the page's single `<time>` element: its `datetime` is
 * the remaining ISO 8601 duration, rewritten every tick, and `PT0S` once the
 * moment has passed.
 *
 * Each digit is keyed by its place and value, so only digits that changed
 * remount and play the CSS "turn" animation. The visible digits are hidden
 * from assistive tech in favour of one plain-language sentence.
 */
export const Countdown = memo(function Countdown({ remaining }: { remaining: Remaining }) {
  const final = remaining.totalSeconds > 0 && remaining.totalSeconds <= 10
  return (
    <time className="clock" dateTime={toIsoDuration(remaining)} data-final={final || undefined}>
      <span className="visually-hidden">{toSpokenDuration(remaining)} until launch</span>
      {UNITS.map(({ key, label }, i) => {
        const text = pad2(remaining[key])
        return (
          <Fragment key={key}>
            {i > 0 && (
              <span className="clock__sep" aria-hidden="true">
                :
              </span>
            )}
            <span className="clock__unit" data-unit={key} aria-hidden="true">
              <span className="clock__digits">
                {[...text].map((d, j) => (
                  <span className="clock__digit" key={`${text.length - j}:${d}`}>
                    {d}
                  </span>
                ))}
              </span>
              <span className="clock__label">{label}</span>
            </span>
          </Fragment>
        )
      })}
    </time>
  )
})
