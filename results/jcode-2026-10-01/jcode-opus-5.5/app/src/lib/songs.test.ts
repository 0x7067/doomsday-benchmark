import { describe, expect, it } from 'vitest'
import { SONGS, matchSong, noteForKey, type Note } from './songs'

describe('matchSong', () => {
  it('recognises every song on its own', () => {
    for (const song of SONGS) expect(matchSong(song.notes)?.id).toBe(song.id)
  })

  it('matches a song at the end of a longer phrase', () => {
    const played: Note[] = ['Up', 'Up', 'Down', 'Right', 'Left', 'Down', 'Right', 'Left']
    expect(matchSong(played)?.title).toBe("Saria's Song")
  })

  it('does not match partial songs', () => {
    expect(matchSong(['Right', 'A', 'Down', 'Right', 'A'])).toBeUndefined()
  })

  it('songs are distinct six-note phrases with a rhythm per note', () => {
    const keys = new Set(SONGS.map((s) => s.notes.join()))
    expect(keys.size).toBe(SONGS.length)
    for (const song of SONGS) expect(song.rhythm).toHaveLength(song.notes.length)
  })
})

describe('noteForKey', () => {
  it('maps arrows and the A key like the N64 pad', () => {
    expect(noteForKey('ArrowUp')).toBe('Up')
    expect(noteForKey('a')).toBe('A')
    expect(noteForKey('A')).toBe('A')
    expect(noteForKey('3')).toBe('Right')
    expect(noteForKey('x')).toBeUndefined()
  })
})
