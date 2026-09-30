import { PLATFORM } from '../../config/launch'
import './arrival.css'

interface ArrivalProps {
  /** The visitor watched the clock reach zero (the text waits for the flash to clear). */
  live: boolean
  /** Replay the launch moment for anyone who arrived after it. */
  onRelive(): void
}

/** What replaces the clock from the moment of launch on. */
export function Arrival({ live, onRelive }: ArrivalProps) {
  return (
    <div className="arrival" data-live={live || undefined}>
      <p className="arrival__eyebrow">November 5, 2026</p>
      <h2 className="arrival__title">The time has come</h2>
      <p className="arrival__body">Ocarina of Time is out now on {PLATFORM}.</p>
      <button type="button" className="arrival__relive" onClick={onRelive}>
        <svg viewBox="0 0 20 20" width="15" height="15" aria-hidden="true">
          <path d="M10 1.5 13.2 7H6.8ZM6.3 8 9.5 13.5H3.1ZM13.7 8l3.2 5.5h-6.4Z" fill="currentColor" />
        </svg>
        Open the Door of Time
      </button>
    </div>
  )
}
