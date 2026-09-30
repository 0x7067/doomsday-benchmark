import { useSyncExternalStore } from 'react'
import type { CountdownStore } from './countdown-store'

export function useRemainingSeconds(store: CountdownStore): number {
  return useSyncExternalStore(store.subscribe, store.getSnapshot)
}
