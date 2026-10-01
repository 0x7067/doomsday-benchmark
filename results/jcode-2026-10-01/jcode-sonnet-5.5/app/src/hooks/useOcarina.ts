import { useCallback, useEffect, useRef, useState } from 'react'
import { ocarinaAudio } from '../audio'
import { MAX_SONG_LENGTH, SONGS, matchSong } from '../data/songs'
import type { Button, Song, SongId } from '../data/songs'

export interface PlayedNote {
  id: number
  button: Button
}

interface Options {
  onSong: (song: SongId) => void
  enabled: boolean
}

const KEYMAP: Record<string, Button> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  a: 'a',
  A: 'a',
}

/** Idle time after which the trail of played notes fades away. */
const TRAIL_TIMEOUT_MS = 3500

/**
 * Owns ocarina input: on-screen buttons and the keyboard (arrow keys = C buttons, A = A).
 * Keeps a short trail of recent notes and calls `onSong` when they spell a known song.
 */
export function useOcarina({ onSong, enabled }: Options) {
  const [trail, setTrail] = useState<PlayedNote[]>([])
  const [lit, setLit] = useState<Button | null>(null)
  const [performing, setPerforming] = useState<Song['id'] | null>(null)
  const nextId = useRef(0)
  const history = useRef<Button[]>([])
  const fade = useRef<ReturnType<typeof setTimeout>>(undefined)
  const litTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const onSongRef = useRef(onSong)

  useEffect(() => {
    onSongRef.current = onSong
  }, [onSong])

  const flash = useCallback((button: Button) => {
    setLit(button)
    clearTimeout(litTimer.current)
    litTimer.current = setTimeout(() => setLit(null), 180)
  }, [])

  const press = useCallback(
    (button: Button) => {
      ocarinaAudio.playNote(button)
      flash(button)
      history.current = [...history.current, button].slice(-MAX_SONG_LENGTH)
      const id = nextId.current++
      setTrail((t) => [...t, { id, button }].slice(-MAX_SONG_LENGTH))
      clearTimeout(fade.current)
      fade.current = setTimeout(() => {
        setTrail([])
        history.current = []
      }, TRAIL_TIMEOUT_MS)

      const song = matchSong(history.current)
      if (song) {
        history.current = []
        clearTimeout(fade.current)
        fade.current = setTimeout(() => setTrail([]), 1400)
        onSongRef.current(song.id)
      }
    },
    [flash],
  )

  /** Plays a song for the visitor (songbook "Play" button), then applies its effect. */
  const perform = useCallback(
    async (song: Song) => {
      setPerforming(song.id)
      clearTimeout(fade.current)
      history.current = []
      setTrail([])
      await ocarinaAudio.playSong(song, (button) => {
        flash(button)
        const id = nextId.current++
        setTrail((t) => [...t, { id, button }].slice(-MAX_SONG_LENGTH))
      })
      setPerforming(null)
      fade.current = setTimeout(() => setTrail([]), 1400)
      onSongRef.current(song.id)
    },
    [flash],
  )

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return
      if (e.target instanceof Element && e.target.closest('input, textarea, select, dialog')) return
      const button = KEYMAP[e.key]
      if (!button) return
      e.preventDefault()
      press(button)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, press])

  useEffect(
    () => () => {
      clearTimeout(fade.current)
      clearTimeout(litTimer.current)
    },
    [],
  )

  return { trail, lit, press, perform, performing, songs: SONGS }
}
