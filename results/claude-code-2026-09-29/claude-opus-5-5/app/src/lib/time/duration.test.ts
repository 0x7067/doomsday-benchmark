import { describe, expect, it } from 'vitest'
import { describeDuration, splitSeconds, toIsoDuration } from './duration'

const D = 86_400
const H = 3_600

describe('splitSeconds', () => {
  it('splits into days, hours, minutes and seconds', () => {
    expect(splitSeconds(37 * D + 11 * H + 10 * 60 + 5)).toEqual({ days: 37, hours: 11, minutes: 10, seconds: 5 })
  })

  it('never goes negative', () => {
    expect(splitSeconds(-42)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  })

  it('lets days grow past two digits', () => {
    expect(splitSeconds(1_000 * D).days).toBe(1_000)
  })
})

describe('toIsoDuration', () => {
  it('matches the brief’s example shape', () => {
    expect(toIsoDuration(37 * D + 11 * H + 10 * 60 + 5)).toBe('P37DT11H10M5S')
  })

  it('keeps every unit while time remains', () => {
    expect(toIsoDuration(10)).toBe('P0DT0H0M10S')
    expect(toIsoDuration(D)).toBe('P1DT0H0M0S')
  })

  it('reads PT0S at and after the moment', () => {
    expect(toIsoDuration(0)).toBe('PT0S')
    expect(toIsoDuration(-5)).toBe('PT0S')
  })
})

describe('describeDuration', () => {
  it('reads naturally and skips empty units', () => {
    expect(describeDuration(37 * D + 10 * 60 + 5)).toBe('37 days, 10 minutes and 5 seconds')
    expect(describeDuration(D + H + 61)).toBe('1 day, 1 hour, 1 minute and 1 second')
    expect(describeDuration(9)).toBe('9 seconds')
    expect(describeDuration(0)).toBe('0 seconds')
  })
})
