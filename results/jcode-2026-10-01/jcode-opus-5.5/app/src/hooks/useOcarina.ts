import { useCallback, useEffect, useRef, useState } from 'react'
import { ocarina } from '../lib/audio'
import { NOTE_BY_ID, STAFF_LENGTH, matchSong, noteForKey, type Note, type Song } from '../lib/songs'

/** One note on the staff. `key` is unique so React can animate each arrival. */
export interface PlayedNote {
  key: number
  note: Note
}

export interface OcarinaState {
  staff: readonly PlayedNote[]
  /** The note sounding right now, for lighting up its pad button. */
  sounding: Note | null
  /** The song just completed, while its banner is up. */
  recognised: Song | null
  /** True while the song book is playing a song back. */
  demoing: boolean
  play: (note: Note) => void
  demo: (song: Song) => void
}

const BEAT_MS = 260
const BANNER_MS = 2800
/** Delay between the last note and the world reacting, so the chime lands first. */
const EFFECT_DELAY_MS = 900

/**
 * Owns the ocarina: notes played by pad, keyboard or song book playback, the
 * staff of recent notes, and recognising songs. `onSong` fires once per
 * completed song. `keyboard` turns key handling off while a dialog owns keys.
 */
export function useOcarina(onSong: (song: Song) => void, keyboard: boolean): OcarinaState {
  const [staff, setStaff] = useState<readonly PlayedNote[]>([])
  const [sounding, setSounding] = useState<Note | null>(null)
  const [recognised, setRecognised] = useState<Song | null>(null)
  const [demoing, setDemoing] = useState(false)

  // The phrase is the source of truth; `staff` mirrors it for rendering.
  const phrase = useRef<readonly PlayedNote[]>([])
  // Set when the phrase just completed a song: the next note starts afresh.
  const completed = useRef(false)
  const nextKey = useRef(0)
  const timers = useRef(new Set<number>())
  const onSongRef = useRef(onSong)
  useEffect(() => {
    onSongRef.current = onSong
  }, [onSong])

  const later = useCallback((fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id)
      fn()
    }, ms)
    timers.current.add(id)
  }, [])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((id) => window.clearTimeout(id))
  }, [])

  const commit = useCallback((next: readonly PlayedNote[]) => {
    phrase.current = next
    setStaff(next)
  }, [])

  const play = useCallback(
    (note: Note, beats = 2) => {
      ocarina.unlock()
      ocarina.note(NOTE_BY_ID[note].frequency, Math.max(0.3, beats * 0.2))
      setSounding(note)
      later(() => setSounding((s) => (s === note ? null : s)), 200)

      // A note played after a completed song starts a new phrase. Otherwise
      // the staff scrolls, keeping the most recent notes.
      const fresh = completed.current
      if (completed.current) {
        completed.current = false
        setRecognised(null)
      }
      const next = [...(fresh ? [] : phrase.current), { key: nextKey.current++, note }].slice(-STAFF_LENGTH)
      commit(next)

      const song = matchSong(next.map((n) => n.note))
      if (!song) return
      completed.current = true
      setRecognised(song)
      later(() => ocarina.secret(), 420)
      later(() => onSongRef.current(song), EFFECT_DELAY_MS)
      later(() => {
        // Only tidy up if nothing has been played since.
        if (phrase.current !== next) return
        completed.current = false
        setRecognised(null)
        commit([])
      }, BANNER_MS)
    },
    [commit, later],
  )

  const demo = useCallback(
    (song: Song) => {
      if (demoing) return
      setDemoing(true)
      completed.current = false
      setRecognised(null)
      commit([])
      let at = 150
      song.notes.forEach((note, i) => {
        const beats = song.rhythm[i]
        later(() => play(note, beats), at)
        at += beats * BEAT_MS
      })
      later(() => setDemoing(false), at)
    },
    [commit, demoing, later, play],
  )

  useEffect(() => {
    if (!keyboard) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      const target = e.target
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable="true"]')) return
      const note = noteForKey(e.key)
      if (!note) return
      e.preventDefault()
      play(note)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keyboard, play])

  return { staff, sounding, recognised, demoing, play, demo }
}
