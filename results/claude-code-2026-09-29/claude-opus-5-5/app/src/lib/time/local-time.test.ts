import { describe, expect, it } from 'vitest'
import { LAUNCH_AT } from '../../config/launch'
import { launchInLocalTime } from './local-time'

describe('launchInLocalTime', () => {
  it('says nothing extra where the clock already reads midnight Eastern', () => {
    expect(launchInLocalTime(LAUNCH_AT, { timeZone: 'America/New_York' })).toBeNull()
    // Same wall clock, different zone: Bogotá is UTC−5 all year.
    expect(launchInLocalTime(LAUNCH_AT, { timeZone: 'America/Bogota' })).toBeNull()
  })

  it('translates the launch into other zones', () => {
    expect(launchInLocalTime(LAUNCH_AT, { locale: 'en-US', timeZone: 'America/Los_Angeles' })).toBe(
      'Wed, Nov 4, 9:00 PM PST',
    )
    expect(launchInLocalTime(LAUNCH_AT, { locale: 'en-GB', timeZone: 'Europe/London' })).toBe('Thu 5 Nov, 05:00 GMT')
  })
})
