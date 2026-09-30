import { useState, type CSSProperties } from 'react'

interface RollingDigitProps {
  value: string
  /** Position in the clock, used to stagger the entrance. */
  index: number
}

/**
 * One glyph of the clock. When the value changes, the old glyph rolls up and
 * away while the new one rises in; both share a grid cell so nothing reflows.
 */
export function RollingDigit({ value, index }: RollingDigitProps) {
  // "Adjusting state while rendering": remember what we showed last so it can animate out.
  const [shown, setShown] = useState({ value, previous: null as string | null, turn: 0 })
  if (shown.value !== value) setShown({ value, previous: shown.value, turn: shown.turn + 1 })

  return (
    <span className="digit" style={{ '--i': index } as CSSProperties}>
      {shown.previous !== null && (
        <span key={`out-${shown.turn}`} className="digit__glyph" data-motion="out">
          {shown.previous}
        </span>
      )}
      <span key={`in-${shown.turn}`} className="digit__glyph" data-motion={shown.turn === 0 ? 'intro' : 'in'}>
        {shown.value}
      </span>
    </span>
  )
}
