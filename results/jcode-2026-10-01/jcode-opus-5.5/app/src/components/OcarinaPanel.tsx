import { memo } from 'react'
import type { PlayedNote } from '../hooks/useOcarina'
import { NOTES, NOTE_BY_ID, STAFF_LENGTH, type Note, type Song } from '../lib/songs'

interface Props {
  staff: readonly PlayedNote[]
  sounding: Note | null
  recognised: Song | null
  demoing: boolean
  onPlay: (note: Note) => void
  onOpenSongbook: () => void
}

/**
 * The in-game ocarina prompt: a five-line staff that fills with the notes you
 * play, and the A / C-button pad underneath. Clicking, tapping, or pressing
 * the arrow keys and A all play notes.
 */
export const OcarinaPanel = memo(function OcarinaPanel({
  staff,
  sounding,
  recognised,
  demoing,
  onPlay,
  onOpenSongbook,
}: Props) {
  return (
    <section className="ocarina" aria-labelledby="ocarina-title" data-recognised={recognised ? true : undefined}>
      <div className="ocarina__head">
        <h2 id="ocarina-title" className="ocarina__title">
          {recognised ? (
            <>
              You played <em>{recognised.title}</em>
            </>
          ) : (
            'Play the ocarina'
          )}
        </h2>
        <button type="button" className="ocarina__book" onClick={onOpenSongbook}>
          Songs
        </button>
      </div>

      <Staff staff={staff} />

      <p className="visually-hidden" aria-live="polite">
        {recognised ? `${recognised.title}. ${recognised.effect}` : ''}
      </p>

      <div className="pad" role="group" aria-label="Ocarina buttons">
        {NOTES.map((n) => (
          <button
            key={n.id}
            type="button"
            className="pad__btn"
            data-note={n.id}
            data-active={sounding === n.id || undefined}
            aria-label={`Play ${n.label}`}
            disabled={demoing}
            // pointerdown, not click: a note should sound the instant it's touched.
            onPointerDown={(e) => {
              if (e.button !== 0) return
              e.preventDefault()
              onPlay(n.id)
            }}
            // Keyboard and assistive-tech activation arrive as a click with
            // detail 0; real pointer clicks were already handled above.
            onClick={(e) => {
              if (e.detail === 0) onPlay(n.id)
            }}
          >
            <span aria-hidden="true">{n.glyph}</span>
          </button>
        ))}
      </div>
      <p className="ocarina__hint" aria-hidden="true">
        <kbd>A</kbd> <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> on a keyboard
      </p>
    </section>
  )
})

/** Five lines; each note sits on its pitch, sliding in from the right. */
function Staff({ staff }: { staff: readonly PlayedNote[] }) {
  return (
    <div className="staff" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((line) => (
        <span key={line} className="staff__line" style={{ bottom: `${line * 25}%` }} />
      ))}
      <ol className="staff__notes" style={{ ['--slots' as string]: STAFF_LENGTH }}>
        {staff.map(({ key, note }) => {
          const spec = NOTE_BY_ID[note]
          return (
            <li key={key} className="staff__note" data-note={note} style={{ ['--pitch' as string]: spec.staff }}>
              {spec.glyph}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
