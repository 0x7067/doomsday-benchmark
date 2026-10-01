/**
 * What the visitor has changed about the world by playing songs. A plain
 * reducer so the rules live in one place and can be tested without a browser.
 */
import type { SongId } from './songs'

export type SceneId = 'forest' | 'deku' | 'field'

export interface World {
  scene: SceneId
  night: boolean
  rain: boolean
  /** Song of Time: a temporary vision of launch night. */
  vision: boolean
}

export type WorldAction = { type: 'song'; song: SongId } | { type: 'endVision' }

export const INITIAL_WORLD: World = { scene: 'forest', night: false, rain: false, vision: false }

/**
 * Development aid: `?world=field,night,rain` starts the page in a given state
 * so each song's effect can be screenshotted without a pointer. Only called
 * behind `import.meta.env.DEV`, so production builds ignore the parameter.
 */
export function worldFromSearch(search: string): World {
  const flags = new Set((new URLSearchParams(search).get('world') ?? '').split(','))
  const scene = (['forest', 'deku', 'field'] as const).find((s) => flags.has(s)) ?? INITIAL_WORLD.scene
  return { scene, night: flags.has('night'), rain: flags.has('rain'), vision: flags.has('vision') }
}

export function worldReducer(world: World, action: WorldAction): World {
  if (action.type === 'endVision') return { ...world, vision: false }
  switch (action.song) {
    case 'saria':
      return { ...world, scene: 'forest' }
    case 'epona':
      return { ...world, scene: 'field' }
    case 'zelda':
      return { ...world, scene: 'deku' }
    case 'sun':
      return { ...world, night: !world.night }
    case 'storms':
      return { ...world, rain: !world.rain }
    case 'time':
      return { ...world, vision: true }
  }
}
