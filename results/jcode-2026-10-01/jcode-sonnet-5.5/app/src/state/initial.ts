import { SCENE_IDS } from '../data/scenes'
import type { SceneId } from '../data/scenes'
import { SONGS } from '../data/songs'
import type { SongId } from '../data/songs'
import { initialStage, stageReducer } from './stage'
import type { Stage } from './stage'

/**
 * Builds the starting stage from the URL, so a particular view can be linked to:
 *   ?scene=deku|field|forest    start in that scene
 *   ?songs=sun,storms           behave as if those songs had already been played
 */
export function stageFromSearch(search: string): Stage {
  const params = new URLSearchParams(search)
  let stage = initialStage

  const scene = params.get('scene')
  if (scene && (SCENE_IDS as readonly string[]).includes(scene)) {
    stage = { ...stage, scene: scene as SceneId }
  }

  const known = new Set<string>(SONGS.map((s) => s.id))
  const songs = (params.get('songs') ?? '').split(',').filter((s): s is SongId => known.has(s))
  for (const song of songs) {
    // `time` and `saria` are one-shot effects, so they make no sense as a starting state.
    if (song === 'time' || song === 'saria' || song === 'lullaby') continue
    stage = stageReducer(stage, { type: 'song', song, nonce: 0 })
  }
  return { ...stage, toast: null }
}
