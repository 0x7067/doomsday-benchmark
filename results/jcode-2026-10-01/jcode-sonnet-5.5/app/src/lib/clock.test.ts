import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClock } from './clock'
import { toIsoDuration } from './countdown'

describe('createClock with ?now=', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('shows 10 seconds left and reaches zero 10 seconds later', () => {
    const clock = createClock({
      search: '?now=2026-11-04T23:59:50-05:00',
      perfNow: () => performance.now(),
    })
    const seen: string[] = []
    const unsubscribe = clock.subscribe(() => seen.push(toIsoDuration(clock.getRemaining())))

    expect(toIsoDuration(clock.getRemaining())).toBe('P0DT0H0M10S')
    vi.advanceTimersByTime(10_000)
    expect(toIsoDuration(clock.getRemaining())).toBe('PT0S')
    expect(seen).toHaveLength(10)
    expect(seen[0]).toBe('P0DT0H0M9S')
    expect(seen.at(-1)).toBe('PT0S')

    vi.advanceTimersByTime(5_000)
    expect(seen).toHaveLength(10) // stops ticking at zero
    unsubscribe()
  })

  it('stays at zero for a moment in the past', () => {
    const clock = createClock({ search: '?now=2027-01-01T00:00:00-05:00' })
    expect(clock.getRemaining()).toBe(0)
    expect(clock.simulated).toBe(true)
  })

  it('follows the wall clock without an override', () => {
    const clock = createClock({ search: '', wallNow: () => Date.parse('2026-11-04T23:59:58-05:00') })
    expect(clock.getRemaining()).toBe(2)
    expect(clock.simulated).toBe(false)
  })
})
