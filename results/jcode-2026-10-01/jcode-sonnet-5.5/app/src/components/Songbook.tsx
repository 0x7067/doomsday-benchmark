import { useEffect, useRef } from 'react'
import { BUTTON_GLYPH, SONGS } from '../data/songs'
import type { Song, SongId } from '../data/songs'
import './Songbook.css'

interface Props {
  open: boolean
  onClose: () => void
  learned: readonly SongId[]
  performing: SongId | null
  onPlay: (song: Song) => void
}

/** The six songs, how to play them, and what they do. A modal <dialog>, so focus and Esc just work. */
export function Songbook({ open, onClose, learned, performing, onPlay }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className="songbook"
      aria-labelledby="songbook-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="songbook__inner">
        <header className="songbook__head">
          <h2 id="songbook-title">Songbook</h2>
          <button type="button" className="songbook__close" onClick={onClose} aria-label="Close songbook">
            ✕
          </button>
        </header>
        <p className="songbook__lede">
          Play a melody with the ocarina below, the arrow keys (C buttons) and <kbd>A</kbd>, or let Link play it for you.
        </p>
        <ul className="songbook__list">
          {SONGS.map((song) => (
            <li key={song.id} className="song" data-learned={learned.includes(song.id)}>
              <div className="song__top">
                <h3 className="song__name">{song.name}</h3>
                {learned.includes(song.id) && (
                  <span className="song__learned" title="You have played this song">
                    ✓ learned
                  </span>
                )}
              </div>
              <div className="song__notes" aria-label={`Notes: ${song.notes.join(', ')}`}>
                {song.notes.map((n, i) => (
                  <span key={i} className="song__note" data-note={n} aria-hidden="true">
                    {BUTTON_GLYPH[n]}
                  </span>
                ))}
              </div>
              <p className="song__effect">{song.effect}</p>
              <button type="button" className="song__play" disabled={performing !== null} onClick={() => onPlay(song)}>
                {performing === song.id ? 'Playing…' : 'Play it for me'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  )
}
