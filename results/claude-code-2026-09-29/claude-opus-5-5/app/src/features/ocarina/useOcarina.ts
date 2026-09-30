import { useCallback, useEffect, useRef, useState } from 'react'
import { synth, type Voice } from '../../lib/audio/synth'
import { NOTES, type Note } from '../../lib/ocarina/notes'
import { matchSong, MAX_SONG_LENGTH, type Song } from '../../lib/ocarina/songs'

export interface StaffNote {
  id: number
  note: Note
}

/** How many notes the staff shows, like the game's. */
export const STAFF_LENGTH = 8
/** A phrase that goes nowhere fades off the staff after this long. */
const IDLE_CLEAR_MS = 4500
/** How long a completed song stays up, glowing. */
const SOLVED_HOLD_MS = 2800
/** Let the last note ring before the world reacts. */
const EFFECT_DELAY_MS = 480
/** Tempo when the songbook plays a song for you. */
const PERFORM_STEP_MS = 430
const PERFORM_HOLD_MS = 350

export interface Ocarina {
  staff: StaffNote[]
  held: ReadonlySet<Note>
  /** The song just completed, while its notes glow on the staff. */
  solved: Song | null
  /** True while the songbook is playing a song by itself. */
  performing: boolean
  press(note: Note): void
  release(note: Note): void
  perform(song: Song): void
}

/**
 * The instrument: plays notes, keeps the phrase on the staff, and recognises
 * songs. `onSong` fires once per completed song, shortly after its last note.
 */
export function useOcarina(onSong: (song: Song) => void): Ocarina {
  const [staff, setStaff] = useState<StaffNote[]>([])
  const [held, setHeld] = useState<ReadonlySet<Note>>(() => new Set())
  const [solved, setSolved] = useState<Song | null>(null)
  const [performing, setPerforming] = useState(false)

  const phrase = useRef<Note[]>([])
  const voices = useRef(new Map<Note, Voice>())
  const nextId = useRef(0)
  const timers = useRef(new Set<number>())
  const clearTimer = useRef<number | undefined>(undefined)
  const isSolved = useRef(false)
  const isPerforming = useRef(false)
  const onSongRef = useRef(onSong)
  useEffect(() => {
    onSongRef.current = onSong
  })

  // Every timer is tracked so unmounting can cancel whatever is still pending.
  const later = useCallback((run: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      run()
    }, ms)
    timers.current.add(id)
    return id
  }, [])
  const cancel = useCallback((id: number | undefined) => {
    if (id === undefined) return
    window.clearTimeout(id)
    timers.current.delete(id)
  }, [])

  const clearStaff = useCallback(() => {
    phrase.current = []
    isSolved.current = false
    setStaff([])
    setSolved(null)
  }, [])

  const sound = useCallback((note: Note) => {
    synth.unlock()
    voices.current.get(note)?.stop()
    voices.current.set(note, synth.noteOn(NOTES[note].frequency))
    setHeld((current) => new Set(current).add(note))
  }, [])

  const release = useCallback((note: Note) => {
    voices.current.get(note)?.stop()
    voices.current.delete(note)
    setHeld((current) => {
      if (!current.has(note)) return current
      const next = new Set(current)
      next.delete(note)
      return next
    })
  }, [])

  const play = useCallback(
    (note: Note) => {
      sound(note)
      // A new phrase starts once a finished song has had its moment.
      if (isSolved.current) clearStaff()
      phrase.current = [...phrase.current, note].slice(-MAX_SONG_LENGTH)
      const id = nextId.current++
      setStaff((current) => [...current, { id, note }].slice(-STAFF_LENGTH))

      cancel(clearTimer.current)
      const song = matchSong(phrase.current)
      if (!song) {
        clearTimer.current = later(clearStaff, IDLE_CLEAR_MS)
        return
      }
      isSolved.current = true
      phrase.current = []
      setSolved(song)
      synth.secret(0.42)
      later(() => onSongRef.current(song), EFFECT_DELAY_MS)
      clearTimer.current = later(clearStaff, SOLVED_HOLD_MS)
    },
    [cancel, clearStaff, later, sound],
  )

  const press = useCallback(
    (note: Note) => {
      // The songbook has the ocarina; don't tangle its melody with ours.
      if (isPerforming.current) return
      play(note)
    },
    [play],
  )

  const perform = useCallback(
    (song: Song) => {
      if (isPerforming.current) return
      synth.unlock()
      clearStaff()
      isPerforming.current = true
      setPerforming(true)
      song.notes.forEach((note, i) => {
        later(() => play(note), 120 + i * PERFORM_STEP_MS)
        later(() => release(note), 120 + i * PERFORM_STEP_MS + PERFORM_HOLD_MS)
      })
      later(() => {
        isPerforming.current = false
        setPerforming(false)
      }, 120 + song.notes.length * PERFORM_STEP_MS)
    },
    [clearStaff, later, play, release],
  )

  useEffect(() => {
    const pending = timers.current
    const sounding = voices.current
    // A key released while the window is in the background never sends keyup.
    const releaseAll = () => {
      for (const note of [...sounding.keys()]) release(note)
    }
    window.addEventListener('blur', releaseAll)
    return () => {
      window.removeEventListener('blur', releaseAll)
      for (const id of pending) window.clearTimeout(id)
      for (const voice of sounding.values()) voice.stop()
    }
  }, [release])

  return { staff, held, solved, performing, press, release, perform }
}
