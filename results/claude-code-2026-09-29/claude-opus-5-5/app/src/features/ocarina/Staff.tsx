import type { CSSProperties } from 'react'
import { NOTES } from '../../lib/ocarina/notes'
import type { Song } from '../../lib/ocarina/songs'
import { NoteGlyph } from './NoteGlyph'
import { STAFF_LENGTH, type StaffNote } from './useOcarina'

interface StaffProps {
  notes: StaffNote[]
  solved: Song | null
}

/** Five lines, notes placed by pitch, newest on the right, like the in-game staff. */
export function Staff({ notes, solved }: StaffProps) {
  return (
    <div className="staff" data-solved={solved ? '' : undefined} style={{ '--slots': STAFF_LENGTH } as CSSProperties}>
      <div className="staff__lines" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((line) => (
          <span key={line} />
        ))}
      </div>
      <div className="staff__notes" aria-hidden="true">
        {notes.map(({ id, note }, slot) => (
          <span
            key={id}
            className="staff__note"
            style={{ '--slot': slot, '--line': NOTES[note].staffLine } as CSSProperties}
          >
            <NoteGlyph note={note} />
          </span>
        ))}
      </div>
      {notes.length === 0 && (
        <p className="staff__placeholder" aria-hidden="true">
          <span className="staff__hint-keys">
            Hold <kbd>A</kbd> and the arrow keys to play
          </span>
          <span className="staff__hint-touch">Hold a note to play</span>
        </p>
      )}
    </div>
  )
}
