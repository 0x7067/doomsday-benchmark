import { SONGS } from '../data/songs'
import type { SongId } from '../data/songs'
import './Toast.css'

/** A "song learned" banner that appears for a few seconds after a melody is played. */
export function Toast({ toast }: { toast: { id: number; song: SongId } | null }) {
  const song = SONGS.find((s) => s.id === toast?.song)
  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      {toast && song && (
        <div className="toast" key={toast.id}>
          <span className="toast__eyebrow">♪ Song played</span>
          <strong className="toast__name">{song.name}</strong>
          <span className="toast__effect">{song.effect}</span>
        </div>
      )}
    </div>
  )
}
