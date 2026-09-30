import { RELEASE_MS } from './release.ts'

export type TickListener = (now: number) => void

interface Subscriber {
  /** 0 means "every animation frame". Anything else is a minimum interval in ms. */
  everyMs: number
  lastSecond: number
  lastFire: number
  listener: TickListener
}

export interface VirtualClock {
  /** The moment we are counting towards. */
  readonly targetMs: number
  /** Current virtual instant, in epoch milliseconds. */
  now(): number
  /** Milliseconds left. Never negative. */
  remaining(): number
  /** Subscribe. Returns an unsubscribe function. */
  subscribe(listener: TickListener, everyMs?: number): () => void
  /** Re-read `now()` immediately and notify everyone. */
  flush(): void
  /** Absolute displacement on top of the real timeline, for the demo controls. */
  setTravel(totalMs: number): void
  travel(): number
  /** True when the page is running on a faked or displaced clock. */
  isSimulated(): boolean
  destroy(): void
}

/**
 * Read `?now=` out of a query string.
 *
 * Anything `Date.parse` cannot make sense of is ignored rather than throwing —
 * a typo in a share link should land the visitor on a working clock, not a
 * stack trace.
 */
export function parseNowParam(search: string): number | null {
  let raw: string | null
  try {
    raw = new URLSearchParams(search).get('now')
  } catch {
    return null
  }
  if (raw === null) return null
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const ms = Date.parse(trimmed)
  return Number.isFinite(ms) ? ms : null
}

/**
 * A monotonic clock that can pretend to be another moment in time.
 *
 * Two things make this more than `setInterval`:
 *
 *  1. It reads `performance.now()`, not `Date.now()`. If the OS clock is
 *     corrected, or a tab is throttled in the background, elapsed time still
 *     accumulates truthfully and the next tick lands on the right second.
 *  2. Every subscriber is notified when the displayed *second* changes, not on a
 *     drifting timer, so the digits never flicker mid-second.
 *
 * A single `requestAnimationFrame` loop drives every subscriber, so the page
 * costs one loop no matter how many things are watching the clock.
 */
export function createVirtualClock(
  targetMs: number = RELEASE_MS,
  originMs: number | null = null,
): VirtualClock {
  const baseMs = originMs ?? Date.now()
  const anchor = performance.now()
  const pinned = originMs !== null

  const subscribers = new Set<Subscriber>()
  let travelMs = 0
  let frame = 0
  let running = false

  const now = (): number => baseMs + (performance.now() - anchor) + travelMs
  const remaining = (): number => Math.max(0, targetMs - now())

  const deliver = (listener: TickListener) => {
    listener(now())
  }

  const frameStep = (timestamp: number) => {
    if (!running) return
    const current = now()
    const second = Math.floor(current / 1000)

    for (const subscriber of subscribers) {
      if (subscriber.everyMs === 0) {
        deliver(subscriber.listener)
        continue
      }
      const secondChanged = second !== subscriber.lastSecond
      const intervalElapsed = timestamp - subscriber.lastFire >= subscriber.everyMs
      if (secondChanged || intervalElapsed) {
        subscriber.lastSecond = second
        subscriber.lastFire = timestamp
        deliver(subscriber.listener)
      }
    }

    frame = requestAnimationFrame(frameStep)
  }

  const start = () => {
    if (running) return
    running = true
    frame = requestAnimationFrame(frameStep)
  }

  const stop = () => {
    running = false
    if (frame) cancelAnimationFrame(frame)
    frame = 0
  }

  // A hidden tab gets no animation frames. Skip the loop entirely rather than
  // spinning it, then re-sync the instant the tab comes back.
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      stop()
    } else {
      start()
      for (const subscriber of subscribers) {
        subscriber.lastSecond = Math.floor(now() / 1000)
        subscriber.lastFire = performance.now()
        deliver(subscriber.listener)
      }
    }
  }

  document.addEventListener('visibilitychange', onVisibility)

  return {
    targetMs,
    now,
    remaining,
    subscribe(listener, everyMs = 1000) {
      const subscriber: Subscriber = {
        everyMs,
        lastSecond: Math.floor(now() / 1000),
        lastFire: performance.now(),
        listener,
      }
      subscribers.add(subscriber)
      if (document.visibilityState === 'visible') start()
      deliver(listener)
      return () => {
        subscribers.delete(subscriber)
        if (subscribers.size === 0) stop()
      }
    },
    flush() {
      for (const subscriber of subscribers) deliver(subscriber.listener)
    },
    setTravel(totalMs) {
      travelMs = totalMs
      this.flush()
    },
    travel: () => travelMs,
    isSimulated: () => pinned || travelMs !== 0,
    destroy() {
      stop()
      subscribers.clear()
      document.removeEventListener('visibilitychange', onVisibility)
    },
  }
}
