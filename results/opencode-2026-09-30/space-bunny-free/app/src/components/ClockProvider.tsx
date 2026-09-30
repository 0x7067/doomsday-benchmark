import { useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import { createVirtualClock, parseNowParam } from '../lib/clock.ts'
import { RELEASE_MS } from '../lib/release.ts'
import { ClockContext } from '../lib/useClock.ts'

/**
 * Installs the page's single source of time.
 *
 * If the URL carries `?now=`, that instant becomes the origin: the clock reads
 * as though the page had loaded at that moment and keeps ticking forward from
 * there. Otherwise the origin is simply the moment the page loaded.
 */
export function ClockProvider({ children }: { children: ReactNode }) {
  const clock = useMemo(() => createVirtualClock(RELEASE_MS, parseNowParam(window.location.search)), [])

  useEffect(() => () => clock.destroy(), [clock])

  return <ClockContext value={clock}>{children}</ClockContext>
}
