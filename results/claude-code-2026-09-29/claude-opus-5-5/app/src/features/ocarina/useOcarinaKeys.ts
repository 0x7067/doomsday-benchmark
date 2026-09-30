import { useEffect } from 'react'
import { noteForKey, type Note } from '../../lib/ocarina/notes'

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
}

/** A and the arrow keys play the ocarina anywhere on the page, held for as long as the key is. */
export function useOcarinaKeys(press: (note: Note) => void, release: (note: Note) => void) {
  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      const note = noteForKey(event.key)
      if (!note) return
      event.preventDefault()
      press(note)
    }
    const up = (event: KeyboardEvent) => {
      const note = noteForKey(event.key)
      if (note) release(note)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [press, release])
}
