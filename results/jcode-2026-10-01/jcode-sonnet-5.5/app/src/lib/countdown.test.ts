import { describe, expect, it } from 'vitest'
import {
  RELEASE_MS,
  msUntilNextTick,
  parseNowParam,
  phaseFor,
  remainingSeconds,
  splitSeconds,
  tensionFor,
  toIsoDuration,
} from './countdown'

describe('toIsoDuration', () => {
  it('formats days, hours, minutes and seconds', () => {
    const total = 37 * 86400 + 11 * 3600 + 10 * 60 + 5
    expect(toIsoDuration(total)).toBe('P37DT11H10M5S')
  })
  it('keeps every component, even when zero', () => {
    expect(toIsoDuration(10)).toBe('P0DT0H0M10S')
  })
  it('is PT0S at and after zero', () => {
    expect(toIsoDuration(0)).toBe('PT0S')
    expect(toIsoDuration(-5)).toBe('PT0S')
  })
})

describe('remainingSeconds', () => {
  it('rounds up and never goes negative', () => {
    expect(remainingSeconds(RELEASE_MS - 9500)).toBe(10)
    expect(remainingSeconds(RELEASE_MS - 1)).toBe(1)
    expect(remainingSeconds(RELEASE_MS)).toBe(0)
    expect(remainingSeconds(RELEASE_MS + 99999)).toBe(0)
  })
})

describe('msUntilNextTick', () => {
  it('waits for the next whole-second flip', () => {
    expect(msUntilNextTick(RELEASE_MS - 9500)).toBe(500)
    expect(msUntilNextTick(RELEASE_MS - 9000)).toBe(1000)
    expect(msUntilNextTick(RELEASE_MS)).toBe(0)
  })
})

describe('parseNowParam', () => {
  it('parses an ISO timestamp with offset', () => {
    expect(parseNowParam('?now=2026-11-04T23:59:50-05:00')).toBe(RELEASE_MS - 10_000)
  })
  it('repairs a "+" that the query string turned into a space', () => {
    expect(parseNowParam('?now=2026-11-05T04:59:50+00:00')).toBe(RELEASE_MS - 10_000)
    expect(parseNowParam('?now=2026-11-05T04:59:50 00:00')).toBe(RELEASE_MS - 10_000)
  })
  it('ignores missing or invalid values', () => {
    expect(parseNowParam('')).toBeNull()
    expect(parseNowParam('?now=nonsense')).toBeNull()
  })
})

describe('splitSeconds / phaseFor / tensionFor', () => {
  it('splits correctly', () => {
    expect(splitSeconds(90061)).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 })
  })
  it('walks through the phases', () => {
    expect([0, 5, 30, 1800, 7200, 3 * 86400, 20 * 86400].map(phaseFor)).toEqual([
      'zero', 'final', 'minute', 'hour', 'day', 'week', 'far',
    ])
  })
  it('rises monotonically towards 1', () => {
    expect(tensionFor(0)).toBe(1)
    expect(tensionFor(10)).toBeGreaterThan(tensionFor(3600))
    expect(tensionFor(3600)).toBeGreaterThan(tensionFor(30 * 86400))
    expect(tensionFor(1e9)).toBe(0)
  })
})
