import { describe, expect, it } from 'vitest'
import { localReleaseLabel } from './format'

describe('localReleaseLabel', () => {
  it('is null for Eastern time', () => {
    expect(localReleaseLabel('America/New_York')).toBeNull()
  })
  it('converts to another zone', () => {
    expect(localReleaseLabel('America/Los_Angeles')).toMatch(/Wednesday, November 4 at 9:00 PM/)
    expect(localReleaseLabel('Europe/London')).toMatch(/Thursday, November 5 at 5:00 AM/)
  })
})
