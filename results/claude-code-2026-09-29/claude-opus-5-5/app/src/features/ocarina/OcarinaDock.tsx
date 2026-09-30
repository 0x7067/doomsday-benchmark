import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { synth } from '../../lib/audio/synth'
import { NOTE_ORDER, type Note } from '../../lib/ocarina/notes'
import type { Song } from '../../lib/ocarina/songs'
import { NoteButton } from './NoteButton'
import { Navi } from './Navi'
import { Songbook } from './Songbook'
import { Staff } from './Staff'
import { useOcarina } from './useOcarina'
import { useOcarinaKeys } from './useOcarinaKeys'
import './ocarina.css'

interface OcarinaDockProps {
  /** A song was completed; `origin` is where the ocarina is on screen, for effects. */
  onSong(song: Song, origin: DOMRect | undefined): void
  /** Extra controls for the phone sheet (e.g. places). */
  children?: ReactNode
  /** The final seconds are playing: fold the ocarina away so nothing covers the clock, and keep hints quiet. */
  hushed?: boolean
}

/**
 * The playable ocarina. On wide screens it sits open in the corner; on
 * phones it folds into a single button and opens as a sheet (a hardware
 * keyboard opens it too, on the first note).
 */
export function OcarinaDock({ onSong, children, hushed = false }: OcarinaDockProps) {
  const panel = useRef<HTMLElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const ocarina = useOcarina((song) => onSong(song, panel.current?.getBoundingClientRect()))
  const [open, setOpen] = useState(false)
  const [songbookOpen, setSongbookOpen] = useState(false)
  const [played, setPlayed] = useState(false)
  const { press: playNote, release, perform, performing } = ocarina

  // Fold everything away once, as the finale starts; the visitor can reopen it.
  const [wasHushed, setWasHushed] = useState(hushed)
  if (hushed !== wasHushed) {
    setWasHushed(hushed)
    if (hushed) {
      setOpen(false)
      setSongbookOpen(false)
    }
  }

  const press = useCallback(
    (note: Note) => {
      setOpen(true)
      setPlayed(true)
      playNote(note)
    },
    [playNote],
  )
  useOcarinaKeys(press, release)

  useEffect(() => {
    if (!open && !songbookOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (songbookOpen) setSongbookOpen(false)
      else setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, songbookOpen])

  return (
    <div className="ocarina-dock" data-open={open || undefined}>
      <Navi quiet={played || open || songbookOpen || performing || hushed} />
      <button
        ref={launcher}
        type="button"
        className="ocarina-launcher"
        aria-expanded={open}
        aria-controls="ocarina"
        onClick={() => {
          synth.unlock()
          setOpen(true)
          // The sheet covers this button; take focus into it (once it's visible).
          requestAnimationFrame(() => panel.current?.focus())
        }}
      >
        <OcarinaIcon />
        Play the ocarina
      </button>

      <section ref={panel} id="ocarina" className="ocarina" aria-labelledby="ocarina-title" tabIndex={-1}>
        <header className="ocarina__header">
          <h2 id="ocarina-title" className="ocarina__title">
            <OcarinaIcon />
            Ocarina
          </h2>
          <button
            type="button"
            className="ocarina__songs"
            aria-expanded={songbookOpen}
            aria-controls="songbook"
            onClick={() => setSongbookOpen((o) => !o)}
          >
            <span aria-hidden="true">♪</span> Songs
          </button>
          <button
            type="button"
            className="ocarina__close"
            aria-label="Put the ocarina away"
            onClick={() => {
              setOpen(false)
              setSongbookOpen(false)
              launcher.current?.focus()
            }}
          >
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {ocarina.solved && (
          <p key={ocarina.solved.id} className="ocarina__toast" aria-hidden="true">
            <span className="ocarina__toast-name">{ocarina.solved.name}</span>
            <span className="ocarina__toast-effect">{ocarina.solved.effect}</span>
          </p>
        )}

        <Staff notes={ocarina.staff} solved={ocarina.solved} />

        <div className="ocarina__pad" role="group" aria-label="Notes">
          {NOTE_ORDER.map((note) => (
            <NoteButton key={note} note={note} held={ocarina.held.has(note)} onPress={press} onRelease={release} />
          ))}
        </div>

        {songbookOpen && (
          <Songbook
            id="songbook"
            performing={performing}
            onPlay={(song) => {
              setSongbookOpen(false)
              perform(song)
            }}
          />
        )}

        {children}

        <p className="sr-only" role="status">
          {ocarina.solved ? `You played ${ocarina.solved.name}. ${ocarina.solved.effect}.` : ''}
        </p>
      </section>
    </div>
  )
}

function OcarinaIcon() {
  return (
    <svg className="ocarina-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M3.2 12.6c0-3.6 3.9-6.1 9-6.1 3.2 0 5.6.9 7.1 2.3l1.9-1.3.9 1.3-1.8 1.3c.3.6.4 1.2.4 1.9 0 3.9-4 6.3-8.9 6.3-5.3 0-8.6-2.2-8.6-5.7z"
        fill="currentColor"
      />
      <g fill="var(--ink-900)">
        <circle cx="8.2" cy="11.4" r="1" />
        <circle cx="11.4" cy="10.4" r="1" />
        <circle cx="14.6" cy="11" r="1" />
        <circle cx="10.2" cy="14.4" r="0.8" />
      </g>
    </svg>
  )
}
