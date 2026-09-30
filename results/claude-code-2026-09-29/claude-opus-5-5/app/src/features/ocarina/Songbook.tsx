import { NOTES } from '../../lib/ocarina/notes'
import { SONGS, type Song } from '../../lib/ocarina/songs'
import { NoteGlyph } from './NoteGlyph'

interface SongbookProps {
  id: string
  performing: boolean
  onPlay(song: Song): void
}

/** The songs this ocarina knows. Pick one to hear it and see what it does. */
export function Songbook({ id, performing, onPlay }: SongbookProps) {
  return (
    <div className="songbook" id={id}>
      <ul className="songbook__list">
        {SONGS.map((song) => (
          <li key={song.id}>
            <button type="button" className="song" onClick={() => onPlay(song)} disabled={performing}>
              <span className="song__name">{song.name}</span>
              <span className="song__notes">
                {song.notes.map((note, i) => (
                  <NoteGlyph key={i} note={note} className="song__glyph" />
                ))}
                <span className="sr-only">({song.notes.map((note) => NOTES[note].name).join(', ')})</span>
              </span>
              <span className="song__effect">{song.effect}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
