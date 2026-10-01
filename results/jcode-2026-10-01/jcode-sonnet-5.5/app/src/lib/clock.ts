import { msUntilNextTick, parseNowParam, remainingSeconds } from './countdown'

/**
 * A tiny external store that ticks once per displayed second.
 *
 * - Normally it follows the system clock.
 * - With `?now=<ISO>` it behaves as if the page loaded at that instant and then
 *   keeps ticking forward on the monotonic `performance.now()` clock, so it is
 *   immune to wall-clock changes during a test.
 *
 * The shape (`subscribe` + `getRemaining`) plugs straight into `useSyncExternalStore`.
 */
export interface Clock {
  /** Current (possibly simulated) time in epoch milliseconds. */
  now: () => number
  /** Whole seconds remaining, never negative. A stable primitive, so it is a valid snapshot. */
  getRemaining: () => number
  subscribe: (listener: () => void) => () => void
  /** True when `?now=` is driving the clock. */
  simulated: boolean
}

interface Sources {
  search: string
  wallNow?: () => number
  perfNow?: () => number
}

export function createClock({
  search,
  wallNow = () => Date.now(),
  perfNow = () => performance.now(),
}: Sources): Clock {
  const override = parseNowParam(search)
  const startPerf = perfNow()
  const now = () => (override === null ? wallNow() : override + (perfNow() - startPerf))
  const getRemaining = () => remainingSeconds(now())

  const listeners = new Set<() => void>()
  let timer: ReturnType<typeof setTimeout> | undefined

  const notify = () => listeners.forEach((l) => l())

  const schedule = () => {
    clearTimeout(timer)
    if (listeners.size === 0 || getRemaining() === 0) return
    timer = setTimeout(() => {
      notify()
      schedule()
    }, msUntilNextTick(now()))
  }

  // Background tabs throttle timers; resync the moment the tab is visible again.
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      notify()
      schedule()
    }
  }

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    if (listeners.size === 1) document.addEventListener('visibilitychange', onVisible)
    schedule()
    return () => {
      listeners.delete(listener)
      if (listeners.size === 0) {
        clearTimeout(timer)
        document.removeEventListener('visibilitychange', onVisible)
      }
    }
  }

  return { now, getRemaining, subscribe, simulated: override !== null }
}

let shared: Clock | undefined

/** The page-wide clock, created on first use from the current URL. */
export function getClock(): Clock {
  shared ??= createClock({ search: window.location.search })
  return shared
}
