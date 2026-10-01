import { useSyncExternalStore } from 'react'
import { getClock } from '../lib/clock'

/** Whole seconds until the moment. Re-renders once per second, and never goes below 0. */
export function useRemaining(): number {
  const clock = getClock()
  return useSyncExternalStore(clock.subscribe, clock.getRemaining)
}
