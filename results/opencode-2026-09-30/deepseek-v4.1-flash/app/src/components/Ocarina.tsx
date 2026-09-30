import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { playOcarinaNote } from '../lib/audio'
import { pseudoRandom } from '../lib/random'
import styles from './Ocarina.module.css'

type NoteId = 'up' | 'left' | 'right' | 'down' | 'a'

type Note = {
  id: NoteId
  glyph: string
  name: string
  pitch: string
  frequency: number
  slot: string
}

const NOTES: Note[] = [
  { id: 'up', glyph: '▲', name: 'C-up', pitch: 'D4', frequency: 293.66, slot: 'up' },
  { id: 'left', glyph: '◀', name: 'C-left', pitch: 'F4', frequency: 349.23, slot: 'left' },
  { id: 'right', glyph: '▶', name: 'C-right', pitch: 'D5', frequency: 587.33, slot: 'right' },
  { id: 'down', glyph: '▼', name: 'C-down', pitch: 'A4', frequency: 440.0, slot: 'down' },
  { id: 'a', glyph: 'A', name: 'A', pitch: 'B4', frequency: 493.88, slot: 'center' },
]

const BY_ID = new Map(NOTES.map((note) => [note.id, note]))

/** The Song of Time, as played on the ocarina: ▶ · A · ▼, twice. */
const SONG: NoteId[] = ['right', 'a', 'down', 'right', 'a', 'down']

type OcarinaProps = {
  soundOn: boolean
  onEnableSound: () => void
}

export function Ocarina({ soundOn, onEnableSound }: OcarinaProps) {
  const [history, setHistory] = useState<NoteId[]>([])
  const [pressed, setPressed] = useState<NoteId | null>(null)
  const [solved, setSolved] = useState(false)
  const pressTimer = useRef<number | undefined>(undefined)
  const solveTimer = useRef<number | undefined>(undefined)

  useEffect(
    () => () => {
      window.clearTimeout(pressTimer.current)
      window.clearTimeout(solveTimer.current)
    },
    [],
  )

  const sparkles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, index) => ({
        id: index,
        x: (pseudoRandom(index * 5 + 1) - 0.5) * 320,
        delay: pseudoRandom(index * 5 + 2) * 0.5,
        duration: 1.6 + pseudoRandom(index * 5 + 3) * 1.2,
        glyph: ['♪', '♫', '◆'][index % 3],
      })),
    [],
  )

  const play = (note: Note) => {
    if (!soundOn) onEnableSound()
    playOcarinaNote(note.frequency)

    setPressed(note.id)
    window.clearTimeout(pressTimer.current)
    pressTimer.current = window.setTimeout(() => setPressed(null), 260)

    const next = [...history, note.id].slice(-SONG.length)
    const complete = next.length === SONG.length && next.every((id, index) => id === SONG[index])

    if (complete) {
      setHistory(next)
      setSolved(true)
      window.clearTimeout(solveTimer.current)
      solveTimer.current = window.setTimeout(() => {
        setSolved(false)
        setHistory([])
      }, 5200)
      return
    }

    // Keep the run only while it could still become the song.
    const possible = next.some((_, start) =>
      SONG.slice(start, start + next.length).every((id, index) => id === next[index]),
    )
    setHistory(possible ? next : [note.id])
  }

  return (
    <div className={styles.ocarina} data-solved={solved}>
      <div className={styles.staff} aria-hidden="true">
        <span className={styles.staffLine} />
        {Array.from({ length: SONG.length }, (_, index) => (
          <span key={index} className={styles.slot} data-filled={Boolean(history[index])}>
            {history[index] ? BY_ID.get(history[index])?.glyph : '◇'}
          </span>
        ))}
      </div>

      <div className={styles.keys} role="group" aria-label="Ocarina notes">
        {NOTES.map((note) => (
          <button
            key={note.id}
            type="button"
            className={styles.key}
            data-slot={note.slot}
            data-pressed={pressed === note.id}
            onClick={() => play(note)}
            aria-label={`${note.name}, ${note.pitch}`}
          >
            <span className={styles.keyGlyph}>{note.glyph}</span>
            <span className={styles.keyPitch}>{note.pitch}</span>
          </button>
        ))}
      </div>

      <p className={styles.hint}>
        {solved ? (
          <span className={styles.reward} role="status">
            The Song of Time echoes — the Door of Time is open.
          </span>
        ) : (
          <>
            The Song of Time: <b>▶</b> <b>A</b> <b>▼</b>, played twice.
          </>
        )}
      </p>

      {solved && (
        <div className={styles.sparkles} aria-hidden="true">
          {sparkles.map((spark) => (
            <span
              key={spark.id}
              className={styles.sparkle}
              style={
                {
                  '--x': `${spark.x}px`,
                  animationDelay: `${spark.delay}s`,
                  animationDuration: `${spark.duration}s`,
                } as CSSProperties
              }
            >
              {spark.glyph}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
