/** The five ocarina buttons, in N64 controller terms. */
export type Button = 'up' | 'down' | 'left' | 'right' | 'a'

export type SongId = 'time' | 'lullaby' | 'saria' | 'sun' | 'storms' | 'epona'

export interface Song {
  id: SongId
  name: string
  notes: readonly Button[]
  /** What it does on this page. */
  effect: string
}

export const SONGS: readonly Song[] = [
  {
    id: 'time',
    name: 'Song of Time',
    notes: ['right', 'a', 'down', 'right', 'a', 'down'],
    effect: 'Slows time: the clock reveals every hundredth of a second',
  },
  {
    id: 'lullaby',
    name: "Zelda's Lullaby",
    notes: ['left', 'up', 'right', 'left', 'up', 'right'],
    effect: 'A royal pulse of golden light',
  },
  {
    id: 'saria',
    name: "Saria's Song",
    notes: ['down', 'right', 'left', 'down', 'right', 'left'],
    effect: 'Back to Kokiri Forest, fireflies and all',
  },
  {
    id: 'epona',
    name: "Epona's Song",
    notes: ['up', 'left', 'right', 'up', 'left', 'right'],
    effect: 'Gallop out onto Hyrule Field',
  },
  {
    id: 'sun',
    name: "Sun's Song",
    notes: ['right', 'down', 'up', 'right', 'down', 'up'],
    effect: 'Daybreak: lifts the gloom. Play again for night',
  },
  {
    id: 'storms',
    name: 'Song of Storms',
    notes: ['a', 'down', 'up', 'a', 'down', 'up'],
    effect: 'Rain and lightning. Play again to clear the sky',
  },
]

export const MAX_SONG_LENGTH = Math.max(...SONGS.map((s) => s.notes.length))

/** Returns the song the most recent notes complete, if any. */
export function matchSong(history: readonly Button[]): Song | null {
  for (const song of SONGS) {
    const n = song.notes.length
    if (history.length >= n && song.notes.every((note, i) => history[history.length - n + i] === note)) {
      return song
    }
  }
  return null
}

/** Notes sit on the N64 ocarina as D4, F4, A4, B4, D5. */
export const NOTE_HZ: Record<Button, number> = {
  a: 293.66,
  down: 349.23,
  right: 440,
  left: 493.88,
  up: 587.33,
}

export const BUTTON_LABEL: Record<Button, string> = {
  up: 'C-Up',
  down: 'C-Down',
  left: 'C-Left',
  right: 'C-Right',
  a: 'A',
}

export const BUTTON_GLYPH: Record<Button, string> = {
  up: '▲',
  down: '▼',
  left: '◀',
  right: '▶',
  a: 'A',
}
