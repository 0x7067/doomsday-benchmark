/**
 * The ocarina: its five notes, the songs it knows and the matcher that spots a
 * song at the end of whatever the visitor has played. Pure data and functions.
 */

export type Note = 'A' | 'Down' | 'Right' | 'Left' | 'Up'

export interface NoteSpec {
  id: Note
  /** Button label shown on the pad, matching the N64 controller. */
  glyph: string
  /** Accessible name. */
  label: string
  /** Pitch in Hz. The real ocarina plays D4 F4 A4 B4 D5. */
  frequency: number
  /** Staff position, 0 = bottom line. */
  staff: number
  /** Keyboard keys (KeyboardEvent.key, lowercased) that play this note. */
  keys: readonly string[]
}

export const NOTES: readonly NoteSpec[] = [
  { id: 'A', glyph: 'A', label: 'A button, D', frequency: 293.66, staff: 0, keys: ['a', '1'] },
  { id: 'Down', glyph: '▼', label: 'C-down, F', frequency: 349.23, staff: 1, keys: ['arrowdown', '2'] },
  { id: 'Right', glyph: '▶', label: 'C-right, A', frequency: 440.0, staff: 2, keys: ['arrowright', '3'] },
  { id: 'Left', glyph: '◀', label: 'C-left, B', frequency: 493.88, staff: 3, keys: ['arrowleft', '4'] },
  { id: 'Up', glyph: '▲', label: 'C-up, D', frequency: 587.33, staff: 4, keys: ['arrowup', '5'] },
]

export const NOTE_BY_ID = Object.fromEntries(NOTES.map((n) => [n.id, n])) as Record<Note, NoteSpec>

export function noteForKey(key: string): Note | undefined {
  const k = key.toLowerCase()
  return NOTES.find((n) => n.keys.includes(k))?.id
}

export type SongId = 'time' | 'saria' | 'epona' | 'sun' | 'storms' | 'zelda'

export interface Song {
  id: SongId
  title: string
  notes: readonly Note[]
  /** Beat length of each note, used to play the song back with its rhythm. */
  rhythm: readonly number[]
  /** What playing it does on this page, shown in the song book. */
  effect: string
}

export const SONGS: readonly Song[] = [
  {
    id: 'time',
    title: 'Song of Time',
    notes: ['Right', 'A', 'Down', 'Right', 'A', 'Down'],
    rhythm: [2, 3, 1, 2, 3, 1],
    effect: 'Opens the Door of Time for a glimpse of launch night.',
  },
  {
    id: 'saria',
    title: "Saria's Song",
    notes: ['Down', 'Right', 'Left', 'Down', 'Right', 'Left'],
    rhythm: [1, 1, 2, 1, 1, 2],
    effect: 'Calls you home to Kokiri Forest.',
  },
  {
    id: 'epona',
    title: "Epona's Song",
    notes: ['Up', 'Left', 'Right', 'Up', 'Left', 'Right'],
    rhythm: [1, 1, 4, 1, 1, 4],
    effect: 'Rides out across Hyrule Field.',
  },
  {
    id: 'zelda',
    title: "Zelda's Lullaby",
    notes: ['Left', 'Up', 'Right', 'Left', 'Up', 'Right'],
    rhythm: [2, 1, 3, 2, 1, 3],
    effect: 'Takes you before the Great Deku Tree.',
  },
  {
    id: 'sun',
    title: "Sun's Song",
    notes: ['Right', 'Down', 'Up', 'Right', 'Down', 'Up'],
    rhythm: [1, 1, 2, 1, 1, 3],
    effect: 'Turns day to night, and back.',
  },
  {
    id: 'storms',
    title: 'Song of Storms',
    notes: ['A', 'Down', 'Up', 'A', 'Down', 'Up'],
    rhythm: [1, 1, 3, 1, 1, 3],
    effect: 'Brings the rain. Play again to clear it.',
  },
]

/** The staff keeps this many notes, like the in-game ocarina prompt. */
export const STAFF_LENGTH = 8

/** Returns the song whose notes end the sequence `played`, if any. */
export function matchSong(played: readonly Note[]): Song | undefined {
  return SONGS.find(
    (song) =>
      played.length >= song.notes.length &&
      song.notes.every((note, i) => played[played.length - song.notes.length + i] === note),
  )
}
