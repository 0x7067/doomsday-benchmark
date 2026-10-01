import { describe, expect, it } from 'vitest'
import { stageFromSearch } from './initial'

describe('stageFromSearch', () => {
  it('reads the scene', () => {
    expect(stageFromSearch('?scene=deku').scene).toBe('deku')
    expect(stageFromSearch('?scene=nope').scene).toBe('forest')
  })
  it('applies stateful songs only', () => {
    const s = stageFromSearch('?songs=sun,storms,time,bogus&scene=field')
    expect(s.day).toBe(true)
    expect(s.rain).toBe(true)
    expect(s.slowTime).toBe(false)
    expect(s.scene).toBe('field')
    expect(s.toast).toBeNull()
  })
  it('defaults cleanly', () => {
    expect(stageFromSearch('')).toMatchObject({ scene: 'forest', day: false, rain: false })
  })
})
