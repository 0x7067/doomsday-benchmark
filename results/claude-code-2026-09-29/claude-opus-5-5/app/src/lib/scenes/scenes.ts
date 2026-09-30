import { sceneImage, type ResponsiveImage } from './images'

export type SceneId = 'kokiri-forest' | 'deku-tree' | 'hyrule-field'
export type Era = 'child' | 'adult'
export type Atmosphere = 'fireflies' | 'leaves' | 'pollen'

export interface Art {
  image: ResponsiveImage
  /** Width ÷ height, used to size `srcset` for `object-fit: cover`. */
  aspect: number
  /** `object-position` that keeps the subject in frame when the screen crops the art. */
  focus: string
  /** Extra zoom from the top edge, to lower a subject that would sit behind the logo. */
  scale?: number
}

export interface Scene {
  id: SceneId
  name: string
  /** Shown under the name on the area title card. */
  subtitle: string
  era: Era
  art: Art
  /** Art-directed version for tall, narrow screens (see `PORTRAIT_QUERY`). */
  portrait?: Art
  atmosphere: Atmosphere
}

export const SCENES: Record<SceneId, Scene> = {
  'kokiri-forest': {
    id: 'kokiri-forest',
    name: 'Kokiri Forest',
    subtitle: 'Home of the Kokiri',
    era: 'child',
    art: { image: sceneImage('kokiri-forest'), aspect: 1920 / 1072, focus: '30% 50%' },
    portrait: { image: sceneImage('kokiri-forest-portrait'), aspect: 1178 / 2552, focus: '50% 62%' },
    atmosphere: 'fireflies',
  },
  'deku-tree': {
    id: 'deku-tree',
    name: 'Great Deku Tree',
    subtitle: 'Where the legend begins',
    era: 'child',
    art: { image: sceneImage('deku-tree'), aspect: 16 / 9, focus: '52% 60%' },
    portrait: { image: sceneImage('deku-tree-portrait'), aspect: 1 / 2, focus: '50% 55%' },
    atmosphere: 'leaves',
  },
  'hyrule-field': {
    id: 'hyrule-field',
    name: 'Hyrule Field',
    subtitle: 'Seven years later',
    era: 'adult',
    art: { image: sceneImage('hyrule-field'), aspect: 16 / 9, focus: '24% 50%' },
    // Link's face would sit right behind the logo on phones; lower it a little.
    portrait: { image: sceneImage('hyrule-field-portrait'), aspect: 1 / 2, focus: '50% 45%', scale: 1.12 },
    atmosphere: 'pollen',
  },
}

export const SCENE_ORDER: SceneId[] = ['kokiri-forest', 'deku-tree', 'hyrule-field']

/** Screens at least this tall-and-narrow get a scene's `portrait` art. */
export const PORTRAIT_QUERY = '(max-aspect-ratio: 4/5)'
