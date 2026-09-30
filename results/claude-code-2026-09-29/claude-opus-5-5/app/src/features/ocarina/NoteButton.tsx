import { synth } from '../../lib/audio/synth'
import { NOTES, type Note } from '../../lib/ocarina/notes'
import { NoteGlyph } from './NoteGlyph'

interface NoteButtonProps {
  note: Note
  held: boolean
  onPress(note: Note): void
  onRelease(note: Note): void
}

/**
 * Press and hold to sustain, like the real thing. Pointer input is handled on
 * pointerdown for zero latency; keyboard activation (Enter/Space on a focused
 * button) arrives as a click with `detail === 0` and plays a short note.
 */
export function NoteButton({ note, held, onPress, onRelease }: NoteButtonProps) {
  const info = NOTES[note]
  return (
    <button
      type="button"
      className="note-button"
      data-note={note}
      data-held={held || undefined}
      aria-label={`Play ${info.name}`}
      aria-keyshortcuts={info.key === 'a' ? 'A' : info.key}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        // Keeps focus where it was and stops touch devices selecting or zooming.
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        onPress(note)
      }}
      onPointerUp={() => {
        // On touch screens only pointerup counts as a user gesture for audio (pointerdown doesn't).
        synth.unlock()
        onRelease(note)
      }}
      onPointerCancel={() => onRelease(note)}
      onLostPointerCapture={() => onRelease(note)}
      onClick={(event) => {
        if (event.detail !== 0) return
        onPress(note)
        window.setTimeout(() => onRelease(note), 260)
      }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <NoteGlyph note={note} className="note-button__glyph" />
      <kbd className="note-button__key" aria-hidden="true">
        {info.keyHint}
      </kbd>
    </button>
  )
}
