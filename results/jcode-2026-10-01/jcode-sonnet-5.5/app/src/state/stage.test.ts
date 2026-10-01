import { describe, expect, it } from 'vitest'
import { initialStage, stageReducer } from './stage'

describe('stageReducer', () => {
  it('Sun and Storms are toggles', () => {
    let s = stageReducer(initialStage, { type: 'song', song: 'sun', nonce: 1 })
    expect(s.day).toBe(true)
    s = stageReducer(s, { type: 'song', song: 'sun', nonce: 2 })
    expect(s.day).toBe(false)
    s = stageReducer(s, { type: 'song', song: 'storms', nonce: 3 })
    expect(s.rain).toBe(true)
  })
  it('Epona and Saria move between scenes', () => {
    let s = stageReducer(initialStage, { type: 'song', song: 'epona', nonce: 1 })
    expect(s.scene).toBe('field')
    s = stageReducer(s, { type: 'song', song: 'saria', nonce: 2 })
    expect(s.scene).toBe('forest')
    expect(s.burst).toBe(1)
  })
  it('Song of Time slows time until told otherwise', () => {
    let s = stageReducer(initialStage, { type: 'song', song: 'time', nonce: 1 })
    expect(s.slowTime).toBe(true)
    s = stageReducer(s, { type: 'slow-time-ended' })
    expect(s.slowTime).toBe(false)
  })
  it('only clears the toast it was scheduled for', () => {
    const s = stageReducer(initialStage, { type: 'song', song: 'sun', nonce: 5 })
    expect(stageReducer(s, { type: 'toast-cleared', nonce: 4 }).toast).not.toBeNull()
    expect(stageReducer(s, { type: 'toast-cleared', nonce: 5 }).toast).toBeNull()
  })
})

describe('arrival', () => {
  it('clears weather and slowed time, and fires the one-shot effects', () => {
    const rainy = { ...initialStage, rain: true, slowTime: true }
    const s = stageReducer(rainy, { type: 'arrival' })
    expect(s.rain).toBe(false)
    expect(s.slowTime).toBe(false)
    expect(s.burst).toBe(1)
    expect(s.flash).toBe(1)
  })
})
