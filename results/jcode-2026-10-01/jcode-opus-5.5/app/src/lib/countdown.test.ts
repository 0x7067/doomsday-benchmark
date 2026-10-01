import { describe, expect, it } from 'vitest'
import {
  LAUNCH_MS,
  clockOffsetFromSearch,
  msUntilNextTick,
  remainingUntil,
  toIsoDuration,
  toSpokenDuration,
} from './countdown'

const at = (iso: string) => Date.parse(iso)

describe('remainingUntil', () => {
  it('targets midnight Eastern on Nov 5, 2026', () => {
    expect(new Date(LAUNCH_MS).toISOString()).toBe('2026-11-05T05:00:00.000Z')
  })

  it('splits the gap into units', () => {
    const r = remainingUntil(at('2026-09-28T12:49:55-05:00'))
    expect(r).toMatchObject({ days: 37, hours: 11, minutes: 10, seconds: 5 })
  })

  it('shows 10 seconds left at 23:59:50 Eastern the night before', () => {
    expect(remainingUntil(at('2026-11-04T23:59:50-05:00'))).toMatchObject({ days: 0, hours: 0, minutes: 0, seconds: 10 })
  })

  it('rounds a partial second up so zero only appears at the moment itself', () => {
    expect(remainingUntil(LAUNCH_MS - 1).totalSeconds).toBe(1)
    expect(remainingUntil(LAUNCH_MS).totalSeconds).toBe(0)
  })

  it('never goes negative after launch', () => {
    expect(remainingUntil(LAUNCH_MS + 86_400_000)).toEqual({ totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0 })
  })
})

describe('toIsoDuration', () => {
  it('always spells out days, hours, minutes and seconds', () => {
    expect(toIsoDuration(remainingUntil(at('2026-09-28T12:49:55-05:00')))).toBe('P37DT11H10M5S')
    expect(toIsoDuration(remainingUntil(LAUNCH_MS - 60_000))).toBe('P0DT0H1M0S')
  })

  it('reads PT0S at and after launch', () => {
    expect(toIsoDuration(remainingUntil(LAUNCH_MS))).toBe('PT0S')
    expect(toIsoDuration(remainingUntil(LAUNCH_MS + 5_000))).toBe('PT0S')
  })
})

describe('toSpokenDuration', () => {
  it('pluralises correctly', () => {
    expect(toSpokenDuration(remainingUntil(LAUNCH_MS - (86_400 + 3_600 + 60 + 2) * 1000))).toBe(
      '1 day, 1 hour, 1 minute, 2 seconds',
    )
  })
})

describe('clockOffsetFromSearch', () => {
  const real = at('2026-10-01T12:00:00Z')

  it('is zero without an override', () => {
    expect(clockOffsetFromSearch('', real)).toBe(0)
    expect(clockOffsetFromSearch('?foo=1', real)).toBe(0)
  })

  it('ignores garbage', () => {
    expect(clockOffsetFromSearch('?now=tomorrow', real)).toBe(0)
  })

  it('shifts the clock to the requested instant', () => {
    const search = '?now=' + encodeURIComponent('2026-11-04T23:59:50-05:00')
    expect(real + clockOffsetFromSearch(search, real)).toBe(LAUNCH_MS - 10_000)
  })

  it('accepts an unencoded + in the offset', () => {
    expect(real + clockOffsetFromSearch('?now=2026-11-05T06:00:00+01:00', real)).toBe(LAUNCH_MS)
  })
})

describe('msUntilNextTick', () => {
  it('lands on the next whole second of the countdown', () => {
    expect(msUntilNextTick(LAUNCH_MS - 10_250)).toBe(250)
    expect(msUntilNextTick(LAUNCH_MS - 10_000)).toBe(1000)
  })

  it('keeps a 1s cadence after launch', () => {
    const wait = msUntilNextTick(LAUNCH_MS + 400)
    expect(wait).toBeGreaterThan(0)
    expect(wait).toBeLessThanOrEqual(1000)
  })
})
