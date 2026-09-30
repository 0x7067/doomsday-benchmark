import type { Note } from './notes'

export type SongId = 'zeldas-lullaby' | 'eponas-song' | 'sarias-song' | 'suns-song' | 'song-of-time' | 'song-of-storms'

export interface Song {
  id: SongId
  name: string
  notes: Note[]
  /** What playing it does here, shown in the songbook. */
  effect: string
}

export const SONGS: Song[] = [
  { id: 'song-of-time', name: 'Song of Time', notes: ['right', 'a', 'down', 'right', 'a', 'down'], effect: 'Travel through time' },
  { id: 'eponas-song', name: 'Epona’s Song', notes: ['up', 'left', 'right', 'up', 'left', 'right'], effect: 'Ride out to Hyrule Field' },
  { id: 'sarias-song', name: 'Saria’s Song', notes: ['down', 'right', 'left', 'down', 'right', 'left'], effect: 'Return to Kokiri Forest' },
  { id: 'suns-song', name: 'Sun’s Song', notes: ['right', 'down', 'up', 'right', 'down', 'up'], effect: 'Turn day into night' },
  { id: 'song-of-storms', name: 'Song of Storms', notes: ['a', 'down', 'up', 'a', 'down', 'up'], effect: 'Call the rain' },
  { id: 'zeldas-lullaby', name: 'Zelda’s Lullaby', notes: ['left', 'up', 'right', 'left', 'up', 'right'], effect: 'Reveal the Triforce' },
]

export const SONG_OF_TIME = SONGS[0]

/** The longest melody, i.e. how many recent notes are worth remembering. */
export const MAX_SONG_LENGTH = Math.max(...SONGS.map((song) => song.notes.length))

/** The song whose melody the most recent notes complete, if any. */
export function matchSong(played: readonly Note[]): Song | null {
  return (
    SONGS.find(
      (song) =>
        played.length >= song.notes.length &&
        song.notes.every((note, i) => played[played.length - song.notes.length + i] === note),
    ) ?? null
  )
}
