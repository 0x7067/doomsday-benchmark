import { BUTTON_GLYPH, BUTTON_LABEL } from '../data/songs'
import type { Button } from '../data/songs'
import type { PlayedNote } from '../hooks/useOcarina'
import './OcarinaPad.css'

interface Props {
  trail: readonly PlayedNote[]
  lit: Button | null
  onPress: (b: Button) => void
}

const LAYOUT: Button[] = ['up', 'left', 'a', 'right', 'down']

/** The five ocarina buttons laid out like the N64's C-buttons around A, plus the staff of notes just played. */
export function OcarinaPad({ trail, lit, onPress }: Props) {
  return (
    <div className="pad" role="group" aria-label="Ocarina. Arrow keys play the C buttons, A plays A.">
      <div className="pad__trail" aria-hidden="true">
        {trail.map((n) => (
          <span className="pad__note" data-note={n.button} key={n.id}>
            {BUTTON_GLYPH[n.button]}
          </span>
        ))}
        {trail.length === 0 && <span className="pad__hint">Play a melody</span>}
      </div>
      <div className="pad__keys">
        {LAYOUT.map((b) => (
          <button
            type="button"
            key={b}
            className="pad__key"
            data-button={b}
            data-lit={lit === b}
            aria-label={`Play ${BUTTON_LABEL[b]}`}
            onPointerDown={(e) => {
              e.preventDefault()
              onPress(b)
            }}
            onKeyDown={(e) => {
              // Enter and Space activate the focused button; arrows are handled globally.
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPress(b)
              }
            }}
          >
            <span aria-hidden="true">{BUTTON_GLYPH[b]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
