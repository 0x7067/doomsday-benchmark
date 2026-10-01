import { describe, expect, it } from 'vitest'
import { SONGS, matchSong } from './songs'
import type { Button } from './songs'

describe('matchSong', () => {
  it('recognises every song from its own notes', () => {
    for (const song of SONGS) expect(matchSong(song.notes)?.id).toBe(song.id)
  })
  it('matches when the song is the tail of a longer history', () => {
    const history: Button[] = ['a', 'a', 'up', ...(SONGS[0]?.notes ?? [])]
    expect(matchSong(history)?.id).toBe('time')
  })
  it('does not match partial or wrong input', () => {
    expect(matchSong(['right', 'a', 'down'])).toBeNull()
    expect(matchSong(['up', 'up', 'up', 'up', 'up', 'up'])).toBeNull()
  })
  it('has no song that is the suffix of another (so detection is unambiguous)', () => {
    for (const a of SONGS) for (const b of SONGS) {
      if (a !== b) expect(matchSong(a.notes)?.id).toBe(a.id)
    }
  })
})
