import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { VirtualClock } from './clock.ts'
import { breakdown, urgency } from './time.ts'
import type { Remaining } from './time.ts'

/**
 * The clock, shared by context.
 *
 * `ClockProvider` lives in its own file so that this one contains no
 * components — which keeps React Fast Refresh honest about what re-renders.
 */
export const ClockContext = createContext<VirtualClock | null>(null)

export function useClock(): VirtualClock {
  const clock = useContext(ClockContext)
  if (!clock) throw new Error('useClock must be used inside <ClockProvider>')
  return clock
}

/**
 * The countdown, re-rendered once per displayed second.
 *
 * Deliberately *not* frame-driven: the digits are laid out from this, and we
 * would rather not ask the browser to re-diff a hero-sized tree sixty times a
 * second to change one character.
 */
export function useRemaining(): Remaining {
  const clock = useClock()
  const [remaining, setRemaining] = useState<Remaining>(() => breakdown(clock.remaining()))

  useEffect(() => clock.subscribe(() => setRemaining(breakdown(clock.remaining()))), [clock])

  return remaining
}

/**
 * 0 to 1 as the moment closes in — the one number that drives every palette
 * shift, glow and particle change on the page. Pure, so it costs nothing to
 * derive during render.
 */
export function useUrgency(remaining: Remaining): number {
  return urgency(remaining.totalMs)
}

/**
 * Re-render on every animation frame.
 *
 * Only for components that animate imperatively — the clock hands — and that
 * write to refs. Never for anything that reconciles a large subtree.
 */
export function useAnimationFrame(callback: (timestamp: number) => void): void {
  const latest = useRef(callback)

  // The callback is refreshed after commit, so the loop never calls a stale
  // closure; the first frame fires after this has already run.
  useEffect(() => {
    latest.current = callback
  })

  useEffect(() => {
    let frame = requestAnimationFrame(function step(timestamp: number) {
      latest.current(timestamp)
      frame = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(frame)
  }, [])
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => prefersReducedMotion())

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return reduced
}

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
