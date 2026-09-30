import { useEffect } from 'react'
import { synth } from '../../lib/audio/synth'
import { NOTES } from '../../lib/ocarina/notes'
import { SONG_OF_TIME } from '../../lib/ocarina/songs'
import { NoteGlyph } from '../ocarina/NoteGlyph'

const LENGTH = SONG_OF_TIME.notes.length

/** Seconds before launch when the empty staff appears. */
export const FINALE_SECONDS = 10

/**
 * The last seconds play the Song of Time by themselves, one note per tick,
 * so the melody completes as the clock reaches zero and the Door of Time
 * opens. Heard only if the visitor has already enabled sound (by playing or
 * toggling it); browsers don't allow audio before a gesture.
 */
export function Finale({ seconds }: { seconds: number }) {
  // T−6 plays the first note … T−1 plays the last.
  const played = Math.max(0, Math.min(LENGTH, LENGTH + 1 - seconds))

  useEffect(() => {
    if (seconds < 1 || seconds > LENGTH) return
    const note = SONG_OF_TIME.notes[LENGTH - seconds]
    synth.note(NOTES[note].frequency, 0.8)
  }, [seconds])

  return (
    <div className="finale" aria-hidden="true">
      <p className="finale__title">Song of Time</p>
      <div className="finale__notes">
        {SONG_OF_TIME.notes.map((note, i) => (
          <span key={i} className="finale__note" data-played={i < played || undefined}>
            <NoteGlyph note={note} />
          </span>
        ))}
      </div>
    </div>
  )
}
