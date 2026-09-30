import { describe, expect, it } from 'vitest'
import { initialWorld, worldReducer, type World, type WorldAction } from './world'

const play = (world: World, ...actions: WorldAction[]) => actions.reduce(worldReducer, world)
const song = (id: Extract<WorldAction, { type: 'song' }>['song']): WorldAction => ({ type: 'song', song: id })

describe('worldReducer', () => {
  it('opens in Kokiri Forest before launch and at the Great Deku Tree after', () => {
    expect(initialWorld(false).sceneId).toBe('kokiri-forest')
    expect(initialWorld(true).sceneId).toBe('deku-tree')
  })

  it('rides to Hyrule Field with Epona’s Song and home with Saria’s', () => {
    const field = play(initialWorld(false), song('eponas-song'))
    expect(field.sceneId).toBe('hyrule-field')
    expect(field.via).toBe('walk')
    expect(play(field, song('sarias-song')).sceneId).toBe('kokiri-forest')
  })

  it('travels between eras with the Song of Time, returning to where the child left', () => {
    const atTree = play(initialWorld(false), { type: 'visit', sceneId: 'deku-tree' })
    const adult = play(atTree, song('song-of-time'))
    expect(adult.sceneId).toBe('hyrule-field')
    expect(adult.via).toBe('warp')
    expect(adult.warps).toBe(1)
    const child = play(adult, song('song-of-time'))
    expect(child.sceneId).toBe('deku-tree')
    expect(child.warps).toBe(2)
  })

  it('toggles night with the Sun’s Song', () => {
    const night = play(initialWorld(false), song('suns-song'))
    expect(night.night).toBe(true)
    expect(play(night, song('suns-song')).night).toBe(false)
  })

  it('brings a storm that later passes', () => {
    const storm = play(initialWorld(false), song('song-of-storms'))
    expect(storm.storm).toBe(true)
    expect(play(storm, { type: 'storm-passed' }).storm).toBe(false)
  })

  it('clears the sky and goes to the Great Deku Tree at launch', () => {
    const launched = play(initialWorld(false), song('eponas-song'), song('suns-song'), song('song-of-storms'), {
      type: 'launch',
    })
    expect(launched).toMatchObject({ sceneId: 'deku-tree', night: false, storm: false })
  })
})
