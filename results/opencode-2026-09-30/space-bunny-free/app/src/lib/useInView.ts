import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Scroll-reveal, with a safety net.
 *
 * The observer is the whole mechanism for a reader who scrolls, and the
 * entrance animations are worth keeping. But content that is `opacity: 0`
 * until it is observed is content that is *missing* to anyone who never
 * scrolls: a screen reader walking the DOM, a print stylesheet, a full-page
 * screenshot, a browser with a broken observer.
 *
 * So: if nobody has scrolled, touched the page or pressed a key within
 * `IDLE_MS`, every pending reveal fires at once. The first real interaction
 * cancels the fallback for good, and from then on the observer is in charge.
 */
const IDLE_MS = 2400

let idleArmed = false
let idleTimer: number | null = null
let interactionSeen = false
const idleListeners = new Set<() => void>()

function cancelIdle(): void {
  interactionSeen = true
  if (idleTimer !== null) {
    window.clearTimeout(idleTimer)
    idleTimer = null
  }
  // Everyone still holding out gets released at once.
  for (const listener of idleListeners) listener()
  idleListeners.clear()
  idleArmed = false
}

function armIdle(): void {
  if (idleArmed || interactionSeen) return
  idleArmed = true
  idleTimer = window.setTimeout(() => {
    idleTimer = null
    for (const listener of idleListeners) listener()
    idleListeners.clear()
    idleArmed = false
  }, IDLE_MS)
}

function installInteractionWatch(): void {
  if (installInteractionWatch.done) return
  installInteractionWatch.done = true

  const events: ReadonlyArray<keyof WindowEventMap> = [
    'wheel',
    'touchstart',
    'pointerdown',
    'keydown',
    'scroll',
  ]
  for (const event of events) {
    window.addEventListener(event, cancelIdle, { passive: true, once: true })
  }
}
installInteractionWatch.done = false

interface Options<T extends Element> {
  /** How much of the element must be visible. */
  threshold?: number
  /** Shrink the observed area so it fires slightly late. */
  rootMargin?: string
  /**
   * Observe this ref instead of a fresh one, so a caller that also needs the
   * node can share it. It must end up attached to the same element as the
   * returned ref, or the hook has nothing to watch.
   */
  ref?: RefObject<T | null>
}

/**
 * Returns a ref to attach and whether the element should currently be shown.
 *
 * The observer flips one attribute and CSS owns the transition, so scrolling
 * never competes with the clock's animation frame for main-thread time.
 */
export function useInView<T extends Element>({
  threshold = 0.12,
  rootMargin = '0px 0px -6% 0px',
  ref: providedRef,
}: Options<T> = {}): [RefObject<T | null>, boolean] {
  const ownRef = useRef<T>(null)
  const ref = providedRef ?? ownRef

  // Without IntersectionObserver there is nothing to wait for, so start visible.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver !== 'function')

  useEffect(() => {
    const node = ref.current
    // State already starts visible when there is no observer; nothing to do.
    if (!node || typeof IntersectionObserver !== 'function') return

    const show = () => setVisible(true)
    idleListeners.add(show)
    armIdle()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold, rootMargin },
    )
    observer.observe(node)

    return () => {
      observer.disconnect()
      idleListeners.delete(show)
    }
  }, [ref, threshold, rootMargin])

  return [ref, visible]
}
