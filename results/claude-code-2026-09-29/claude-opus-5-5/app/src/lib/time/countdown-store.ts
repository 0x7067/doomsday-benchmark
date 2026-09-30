import type { Now } from './clock'

/**
 * Whole seconds left until `target`, never negative.
 *
 * Rounded *up*: with 9.4 s left we show 10, and 0 appears at the exact
 * instant the moment arrives, not a second early.
 */
export function secondsUntil(target: number, now: number): number {
  return Math.max(0, Math.ceil((target - now) / 1000))
}

/** Delay until `secondsUntil` next changes, given `msLeft > 0`. Always in (0, 1000]. */
export function msUntilNextTick(msLeft: number): number {
  return msLeft - (Math.ceil(msLeft / 1000) - 1) * 1000
}

export interface CountdownStore {
  subscribe(onChange: () => void): () => void
  /** Whole seconds remaining (see `secondsUntil`). Stable between ticks. */
  getSnapshot(): number
}

/**
 * The single source of truth for "how long is left", shaped for
 * `useSyncExternalStore`.
 *
 * Rather than a drifting `setInterval(1000)`, each timeout is aimed at the
 * next second boundary of the remaining time and re-derived from the clock
 * when it fires. Background tabs throttle timers, so the value is also
 * re-synced whenever the page becomes visible again.
 */
export function createCountdownStore(target: number, now: Now): CountdownStore {
  const listeners = new Set<() => void>()
  let current = secondsUntil(target, now())
  let timer: ReturnType<typeof setTimeout> | undefined

  function sync() {
    clearTimeout(timer)
    timer = undefined
    const at = now()
    const msLeft = target - at
    const next = secondsUntil(target, at)
    if (next !== current) {
      current = next
      for (const listener of listeners) listener()
    }
    if (msLeft > 0 && listeners.size > 0) timer = setTimeout(sync, msUntilNextTick(msLeft))
  }

  function onWake() {
    if (document.visibilityState === 'visible') sync()
  }

  return {
    getSnapshot: () => current,
    subscribe(onChange) {
      listeners.add(onChange)
      if (listeners.size === 1) {
        document.addEventListener('visibilitychange', onWake)
        window.addEventListener('pageshow', onWake)
        sync()
      }
      return () => {
        listeners.delete(onChange)
        if (listeners.size > 0) return
        clearTimeout(timer)
        timer = undefined
        document.removeEventListener('visibilitychange', onWake)
        window.removeEventListener('pageshow', onWake)
      }
    },
  }
}
