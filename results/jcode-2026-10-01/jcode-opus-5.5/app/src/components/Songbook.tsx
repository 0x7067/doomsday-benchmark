import { useEffect, useRef } from 'react'
import { NOTE_BY_ID, SONGS, type Song } from '../lib/songs'

interface Props {
  open: boolean
  onClose: () => void
  /** Plays the song back on the ocarina, which also triggers its effect. */
  onPerform: (song: Song) => void
}

/**
 * The quest-status song list. A native `<dialog>` gives focus trapping, Esc to
 * close and an inert page behind it for free.
 */
export function Songbook({ open, onClose, onPerform }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className="songbook"
      aria-labelledby="songbook-title"
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop (the dialog element itself) closes it.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="songbook__inner">
        <header className="songbook__head">
          <h2 id="songbook-title">Songs</h2>
          <button type="button" className="songbook__close" onClick={onClose} aria-label="Close songs">
            ×
          </button>
        </header>
        <p className="songbook__intro">
          Play these on the ocarina pad or your keyboard. Each one changes the world around the clock.
        </p>
        <ul className="songbook__list">
          {SONGS.map((song) => (
            <li key={song.id} className="song" data-song={song.id}>
              <div className="song__text">
                <h3>{song.title}</h3>
                <p>{song.effect}</p>
              </div>
              <span className="song__notes" aria-label={song.notes.map((n) => NOTE_BY_ID[n].label).join(', ')}>
                {song.notes.map((n, i) => (
                  <span key={i} data-note={n} aria-hidden="true">
                    {NOTE_BY_ID[n].glyph}
                  </span>
                ))}
              </span>
              <button
                type="button"
                className="song__play"
                onClick={() => {
                  onClose()
                  onPerform(song)
                }}
              >
                Play<span className="visually-hidden"> {song.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  )
}
