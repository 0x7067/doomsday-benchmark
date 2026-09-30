import { useEffect, useState } from 'react'
import { synth } from '../../lib/audio/synth'
import './sound-toggle.css'

const STORAGE_KEY = 'ocarina-countdown:muted'

function readMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function writeMuted(muted: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0')
  } catch {
    // Storage can be unavailable (private modes, policies); the toggle still works for this visit.
  }
}

export function SoundToggle() {
  const [muted, setMuted] = useState(readMuted)

  useEffect(() => {
    synth.setMuted(muted)
    writeMuted(muted)
  }, [muted])

  return (
    <button
      type="button"
      className="sound-toggle"
      aria-pressed={!muted}
      onClick={() => {
        synth.unlock()
        setMuted((m) => !m)
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" />
        {muted ? (
          <path d="M16 9.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        ) : (
          <path
            d="M15.5 9a4.2 4.2 0 010 6M18 6.5a7.7 7.7 0 010 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        )}
      </svg>
      <span className="sound-toggle__label">Sound</span>
    </button>
  )
}
