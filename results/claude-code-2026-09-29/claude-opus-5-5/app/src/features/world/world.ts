import { SCENES, type SceneId } from '../../lib/scenes/scenes'
import type { SongId } from '../../lib/ocarina/songs'

/** Everything the songs can change about the world behind the clock. */
export interface World {
  sceneId: SceneId
  /** Where the Song of Time returns to from the adult era. */
  childSceneId: SceneId
  /** How the current scene was reached: walked to (cross-fade) or warped to (cut under a flash). */
  via: 'walk' | 'warp'
  night: boolean
  storm: boolean
  /** Bumped by one-shot effects so their overlays replay each time. */
  warps: number
  triforces: number
  storms: number
}

export type WorldAction =
  | { type: 'visit'; sceneId: SceneId }
  | { type: 'song'; song: SongId }
  | { type: 'storm-passed' }
  | { type: 'launch' }

export const LAUNCH_SCENE: SceneId = 'deku-tree'

export function initialWorld(launched: boolean): World {
  const sceneId: SceneId = launched ? LAUNCH_SCENE : 'kokiri-forest'
  return { sceneId, childSceneId: sceneId, via: 'walk', night: false, storm: false, warps: 0, triforces: 0, storms: 0 }
}

function visit(world: World, sceneId: SceneId, via: World['via'] = 'walk'): World {
  return {
    ...world,
    sceneId,
    via,
    childSceneId: SCENES[sceneId].era === 'child' ? sceneId : world.childSceneId,
  }
}

export function worldReducer(world: World, action: WorldAction): World {
  switch (action.type) {
    case 'visit':
      return visit(world, action.sceneId)
    case 'storm-passed':
      return { ...world, storm: false }
    case 'launch':
      return { ...visit(world, LAUNCH_SCENE, 'warp'), night: false, storm: false, warps: world.warps + 1 }
    case 'song':
      switch (action.song) {
        case 'song-of-time': {
          const destination = SCENES[world.sceneId].era === 'child' ? 'hyrule-field' : world.childSceneId
          return { ...visit(world, destination, 'warp'), warps: world.warps + 1 }
        }
        case 'eponas-song':
          return visit(world, 'hyrule-field')
        case 'sarias-song':
          return visit(world, 'kokiri-forest')
        case 'suns-song':
          return { ...world, night: !world.night }
        case 'song-of-storms':
          return { ...world, storm: true, storms: world.storms + 1 }
        case 'zeldas-lullaby':
          return { ...world, triforces: world.triforces + 1 }
      }
  }
}
