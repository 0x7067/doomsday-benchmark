import { describe, expect, it } from 'vitest'
import { noteForKey } from './notes'
import { matchSong, SONGS } from './songs'

describe('matchSong', () => {
  it('recognises every song', () => {
    for (const song of SONGS) expect(matchSong(song.notes)?.id).toBe(song.id)
  })

  it('matches a song that ends a longer phrase', () => {
    expect(matchSong(['up', 'up', 'right', 'a', 'down', 'right', 'a', 'down'])?.id).toBe('song-of-time')
  })

  it('does not match partial or wrong melodies', () => {
    expect(matchSong(['right', 'a', 'down', 'right', 'a'])).toBeNull()
    expect(matchSong(['right', 'a', 'down', 'right', 'a', 'up'])).toBeNull()
    expect(matchSong([])).toBeNull()
  })

  it('has no two songs sharing a melody', () => {
    const melodies = SONGS.map((song) => song.notes.join(' '))
    expect(new Set(melodies).size).toBe(melodies.length)
  })
})

describe('noteForKey', () => {
  it('maps A and the arrow keys to notes', () => {
    expect(noteForKey('a')).toBe('a')
    expect(noteForKey('A')).toBe('a')
    expect(noteForKey('ArrowUp')).toBe('up')
    expect(noteForKey('ArrowLeft')).toBe('left')
    expect(noteForKey('Enter')).toBeNull()
  })
})
