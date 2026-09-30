/**
 * The ocarina's five notes, named after the N64 buttons that play them.
 * Pitches are the game's: D4, F4, A4, B4, D5.
 */
export type Note = 'a' | 'down' | 'right' | 'left' | 'up'

export interface NoteInfo {
  /** Accessible name, e.g. "C-Down". */
  name: string
  /** Keyboard key (`KeyboardEvent.key`) that plays it. */
  key: string
  /** Short key hint shown on the button. */
  keyHint: string
  frequency: number
  /** Line on the five-line staff, 0 = bottom. */
  staffLine: number
}

export const NOTES: Record<Note, NoteInfo> = {
  a: { name: 'A', key: 'a', keyHint: 'A', frequency: 293.66, staffLine: 0 },
  down: { name: 'C-Down', key: 'ArrowDown', keyHint: '↓', frequency: 349.23, staffLine: 1 },
  right: { name: 'C-Right', key: 'ArrowRight', keyHint: '→', frequency: 440.0, staffLine: 2 },
  left: { name: 'C-Left', key: 'ArrowLeft', keyHint: '←', frequency: 493.88, staffLine: 3 },
  up: { name: 'C-Up', key: 'ArrowUp', keyHint: '↑', frequency: 587.33, staffLine: 4 },
}

export const NOTE_ORDER: Note[] = ['a', 'down', 'right', 'left', 'up']

export function noteForKey(key: string): Note | null {
  const normalized = key.length === 1 ? key.toLowerCase() : key
  return NOTE_ORDER.find((note) => NOTES[note].key === normalized) ?? null
}
