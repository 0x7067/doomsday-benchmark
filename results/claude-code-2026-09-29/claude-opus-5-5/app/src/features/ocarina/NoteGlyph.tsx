import type { Note } from '../../lib/ocarina/notes'

const ROTATION: Record<Exclude<Note, 'a'>, number> = { up: 0, right: 90, down: 180, left: 270 }

interface NoteGlyphProps {
  note: Note
  className?: string
}

/**
 * The note icons from the game's staff: a blue A button, or a yellow C arrow.
 * Drawn as paths so they don't depend on any font.
 */
export function NoteGlyph({ note, className }: NoteGlyphProps) {
  return (
    <svg className={className} viewBox="-12 -12 24 24" aria-hidden="true" data-note={note}>
      {note === 'a' ? (
        <>
          <circle r="10.5" fill="url(#glyph-a)" stroke="#0f2a6b" strokeWidth="1.2" />
          <path
            d="M-4.6 5.2 0-5.6 4.6 5.2M-2.7 1.4h5.4"
            fill="none"
            stroke="#f4f8ff"
            strokeWidth="2.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <path
          d="M0-9.5 9 6.5H-9Z"
          transform={`rotate(${ROTATION[note]})`}
          fill="url(#glyph-c)"
          stroke="#6b4a00"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

/** Gradients every glyph references by id; rendered once, at the app root. */
export function NoteGlyphDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="glyph-a" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#8fb2ff" />
          <stop offset="0.55" stopColor="#3b6fe3" />
          <stop offset="1" stopColor="#1e3f99" />
        </radialGradient>
        <linearGradient id="glyph-c" x1="0" y1="-1" x2="0" y2="1">
          <stop offset="0" stopColor="#fff2a8" />
          <stop offset="0.5" stopColor="#f7c62f" />
          <stop offset="1" stopColor="#c58a06" />
        </linearGradient>
      </defs>
    </svg>
  )
}
