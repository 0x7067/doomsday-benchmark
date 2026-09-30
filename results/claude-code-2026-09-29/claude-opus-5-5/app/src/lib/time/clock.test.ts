import { describe, expect, it } from 'vitest'
import { createClock, parseNowParam } from './clock'

describe('parseNowParam', () => {
  it('parses an ISO 8601 timestamp with an offset', () => {
    expect(parseNowParam('?now=2026-11-04T23:59:50-05:00')).toBe(Date.parse('2026-11-05T04:59:50Z'))
  })

  it('accepts UTC and percent-encoded offsets', () => {
    expect(parseNowParam('?now=2026-11-05T04:59:50Z')).toBe(Date.parse('2026-11-05T04:59:50Z'))
    expect(parseNowParam('?now=2026-11-05T05:59:50%2B01:00')).toBe(Date.parse('2026-11-05T04:59:50Z'))
  })

  it('repairs a "+" offset that the query string decoded into a space', () => {
    expect(parseNowParam('?now=2026-11-05T05:59:50+01:00')).toBe(Date.parse('2026-11-05T04:59:50Z'))
  })

  it('ignores missing, empty and invalid values', () => {
    expect(parseNowParam('')).toBeNull()
    expect(parseNowParam('?now=')).toBeNull()
    expect(parseNowParam('?now=soon')).toBeNull()
    expect(parseNowParam('?other=1')).toBeNull()
  })
})

describe('createClock', () => {
  it('is the real clock when no start is given', () => {
    const real = () => 1234
    expect(createClock(null, real)).toBe(real)
  })

  it('starts at the given instant and keeps real speed', () => {
    let real = 1_000
    const now = createClock(50_000, () => real)
    expect(now()).toBe(50_000)
    real += 2_500
    expect(now()).toBe(52_500)
  })
})
