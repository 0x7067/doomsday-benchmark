import { useEffect, useState } from 'react'
import { NOTES } from '../../lib/ocarina/notes'
import { SONG_OF_TIME } from '../../lib/ocarina/songs'
import { NoteGlyph } from './NoteGlyph'
import './navi.css'

/** How long a visitor can sit without playing before Navi pipes up. */
const HINT_AFTER_MS = 7000

interface NaviProps {
  /** Stay out of the way: the visitor has found the ocarina, or something else is on screen. */
  quiet: boolean
}

/**
 * The game's hint system. If nobody has touched the ocarina after a few
 * seconds, Navi flies in once with a tip in her blue text box. Playing any
 * note, opening the ocarina or dismissing her sends her away for good.
 */
export function Navi({ quiet }: NaviProps) {
  const [due, setDue] = useState(false)
  const [shown, setShown] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setDue(true), HINT_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])

  const visible = due && !quiet && !dismissed
  // Once she has spoken, anything that quiets her sends her away for good.
  if (visible && !shown) setShown(true)
  if (shown && quiet && !dismissed) setDismissed(true)

  if (!visible) return null
  return (
    <aside className="navi" aria-label="Hint">
      <span className="navi__fairy" aria-hidden="true">
        <span className="navi__wing navi__wing--left" />
        <span className="navi__wing navi__wing--right" />
      </span>
      <div className="navi__box">
        <p className="navi__hey">Hey! Listen!</p>
        <p className="navi__text">
          Play the <strong>{SONG_OF_TIME.name}</strong> to travel through time.
        </p>
        <p className="navi__notes">
          {SONG_OF_TIME.notes.map((note, i) => (
            <NoteGlyph key={i} note={note} className="navi__glyph" />
          ))}
          <span className="sr-only">{SONG_OF_TIME.notes.map((note) => NOTES[note].name).join(', ')}</span>
        </p>
        <button type="button" className="navi__dismiss" aria-label="Dismiss hint" onClick={() => setDismissed(true)}>
          <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
            <path d="M3.5 3.5l9 9m0-9l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
