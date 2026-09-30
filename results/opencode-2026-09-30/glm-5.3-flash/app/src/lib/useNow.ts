import { useEffect, useState } from 'react'
import type { SimulatedClock } from './time'

export function currentSimulatedTime(clock: SimulatedClock | null): number {
  const real = Date.now()
  return clock === null ? real : real - clock.offsetMs
}

/**
 * A clock that re-renders once per second, aligned to the second boundary so
 * the digits flip in step with real time. Uses the real clock on every tick
 * (rather than incrementing a counter) so background-tab throttling, sleeps
 * and debugger pauses self-correct on the next tick. When the tab becomes
 * visible again the tick fires immediately instead of waiting out the tail
 * of the current second.
 */
export function useNow(clock: SimulatedClock | null): number {
  const [now, setNow] = useState(() => currentSimulatedTime(clock))

  useEffect(() => {
    let timer: number | undefined
    const schedule = () => {
      timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 25)
    }
    const tick = () => {
      setNow(currentSimulatedTime(clock))
      schedule()
    }
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return
      window.clearTimeout(timer)
      tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    schedule()
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [clock])

  return now
}
