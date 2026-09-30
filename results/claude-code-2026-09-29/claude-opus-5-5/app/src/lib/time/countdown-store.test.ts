// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createClock } from './clock'
import { createCountdownStore, msUntilNextTick, secondsUntil } from './countdown-store'

const TARGET = Date.parse('2026-11-05T00:00:00-05:00')

describe('secondsUntil', () => {
  it('rounds up so zero lands exactly on the moment', () => {
    expect(secondsUntil(TARGET, TARGET - 10_000)).toBe(10)
    expect(secondsUntil(TARGET, TARGET - 9_001)).toBe(10)
    expect(secondsUntil(TARGET, TARGET - 9_000)).toBe(9)
    expect(secondsUntil(TARGET, TARGET - 1)).toBe(1)
    expect(secondsUntil(TARGET, TARGET)).toBe(0)
  })

  it('never goes negative', () => {
    expect(secondsUntil(TARGET, TARGET + 60_000)).toBe(0)
  })
})

describe('msUntilNextTick', () => {
  it('aims at the next second boundary of the remaining time', () => {
    expect(msUntilNextTick(9_500)).toBe(500)
    expect(msUntilNextTick(9_000)).toBe(1_000)
    expect(msUntilNextTick(1)).toBe(1)
  })
})

describe('createCountdownStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ticks once per second and reaches zero ten seconds after ?now=…23:59:50', () => {
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z')) // the real clock is irrelevant
    const now = createClock(Date.parse('2026-11-04T23:59:50-05:00'))
    const store = createCountdownStore(TARGET, now)
    const seen: number[] = []
    const unsubscribe = store.subscribe(() => seen.push(store.getSnapshot()))

    expect(store.getSnapshot()).toBe(10)
    vi.advanceTimersByTime(999)
    expect(store.getSnapshot()).toBe(10)
    vi.advanceTimersByTime(1)
    expect(store.getSnapshot()).toBe(9)
    vi.advanceTimersByTime(9_000)
    expect(store.getSnapshot()).toBe(0)
    expect(seen).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0])

    // Nothing is scheduled once the moment has passed.
    expect(vi.getTimerCount()).toBe(0)
    unsubscribe()
  })

  it('stays at zero after the moment', () => {
    const now = createClock(TARGET + 5_000)
    const store = createCountdownStore(TARGET, now)
    const unsubscribe = store.subscribe(() => {})
    expect(store.getSnapshot()).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
    unsubscribe()
  })

  it('catches up when a throttled tab becomes visible again', () => {
    let real = 0
    const store = createCountdownStore(100_000, () => real)
    const unsubscribe = store.subscribe(() => {})
    real = 42_000 // time passed without the timer firing
    document.dispatchEvent(new Event('visibilitychange'))
    expect(store.getSnapshot()).toBe(58)
    unsubscribe()
  })

  it('stops its timer when the last subscriber leaves', () => {
    const store = createCountdownStore(Date.now() + 60_000, Date.now)
    const unsubscribe = store.subscribe(() => {})
    expect(vi.getTimerCount()).toBe(1)
    unsubscribe()
    expect(vi.getTimerCount()).toBe(0)
  })
})
