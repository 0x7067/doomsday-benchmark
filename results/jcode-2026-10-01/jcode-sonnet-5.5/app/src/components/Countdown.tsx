import { Digit } from './Digit'
import { Hundredths } from './Hundredths'
import { pad2, splitSeconds } from '../lib/countdown'
import './Countdown.css'

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
] as const

interface Props {
  remaining: number
  /** Song of Time: reveal hundredths of a second. */
  slowTime: boolean
  /** A small, quiet row, used once the moment has passed. */
  compact?: boolean
}

export function Countdown({ remaining, slowTime, compact = false }: Props) {
  const parts = splitSeconds(remaining)
  const text = UNITS.map(({ key }) => (key === 'days' ? String(parts.days).padStart(2, '0') : pad2(parts[key])))
  const widest = Math.max(...text.map((t) => t.length))

  return (
    <div className="clock" data-compact={compact} aria-hidden="true">
      <div className="clock__grid" style={{ '--n': widest } as React.CSSProperties}>
        {UNITS.map(({ key, label }, i) => (
          <div className="unit" data-unit={key} key={key}>
            <div className="unit__digits">
              {Array.from(text[i] ?? '').map((ch, pos, arr) => (
                // Right-aligned keys so a digit keeps its identity when the number of digits changes.
                <Digit key={arr.length - pos} value={ch} />
              ))}
            </div>
            <div className="unit__label">{label}</div>
            {key === 'seconds' && slowTime && <Hundredths />}
          </div>
        ))}
      </div>
    </div>
  )
}
