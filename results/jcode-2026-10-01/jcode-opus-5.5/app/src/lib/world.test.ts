import { describe, expect, it } from 'vitest'
import { INITIAL_WORLD, worldReducer } from './world'

describe('worldReducer', () => {
  it('moves between scenes', () => {
    const field = worldReducer(INITIAL_WORLD, { type: 'song', song: 'epona' })
    expect(field.scene).toBe('field')
    expect(worldReducer(field, { type: 'song', song: 'zelda' }).scene).toBe('deku')
    expect(worldReducer(field, { type: 'song', song: 'saria' }).scene).toBe('forest')
  })

  it('toggles night and rain independently', () => {
    const night = worldReducer(INITIAL_WORLD, { type: 'song', song: 'sun' })
    const stormyNight = worldReducer(night, { type: 'song', song: 'storms' })
    expect(stormyNight).toMatchObject({ night: true, rain: true })
    expect(worldReducer(stormyNight, { type: 'song', song: 'sun' })).toMatchObject({ night: false, rain: true })
  })

  it('opens and closes the Song of Time vision', () => {
    const vision = worldReducer(INITIAL_WORLD, { type: 'song', song: 'time' })
    expect(vision.vision).toBe(true)
    expect(worldReducer(vision, { type: 'endVision' }).vision).toBe(false)
  })
})
