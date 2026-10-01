import { useState } from 'react'

/**
 * A single numeral in a fixed-width cell. When the value changes, the old numeral
 * drifts down and fades while the new one falls in from above.
 */
export function Digit({ value }: { value: string }) {
  const [track, setTrack] = useState({ current: value, previous: null as string | null })
  // Derive "previous" during render (React's documented pattern for state that follows a prop).
  if (track.current !== value) setTrack({ current: value, previous: track.current })

  return (
    <span className="digit" aria-hidden="true">
      {track.previous !== null && (
        <span key={`out-${track.previous}-${track.current}`} className="digit__glyph digit__glyph--out">
          {track.previous}
        </span>
      )}
      <span key={`in-${track.current}`} className="digit__glyph digit__glyph--in">
        {track.current}
      </span>
    </span>
  )
}
