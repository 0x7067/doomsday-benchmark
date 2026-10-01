import { useEffect, useState } from 'react'
import { LAUNCH_MS, clockOffsetFromSearch, msUntilNextTick } from '../lib/countdown'

/**
 * The page's notion of "now", in ms. Honours `?now=` by shifting the real
 * clock by a fixed offset captured once at load, so an overridden page keeps
 * ticking in real time from the requested instant.
 *
 * Re-renders exactly when the displayed second changes: each timeout is
 * scheduled for the next whole-second boundary of the countdown instead of a
 * free-running `setInterval`, which drifts and can skip a digit.
 */
export function useClock(): number {
  const [offset] = useState(() => clockOffsetFromSearch(window.location.search, Date.now()))
  const [now, setNow] = useState(() => Date.now() + offset)

  useEffect(() => {
    let timer = 0
    const read = () => Date.now() + offset
    const schedule = () => {
      // A few ms of slack so we land just after the boundary, not just before.
      timer = window.setTimeout(() => {
        setNow(read())
        schedule()
      }, msUntilNextTick(read(), LAUNCH_MS) + 8)
    }
    schedule()

    // Background tabs throttle timers; resync the moment we're visible again.
    const resync = () => {
      if (document.visibilityState !== 'visible') return
      window.clearTimeout(timer)
      setNow(read())
      schedule()
    }
    document.addEventListener('visibilitychange', resync)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', resync)
    }
  }, [offset])

  return now
}
