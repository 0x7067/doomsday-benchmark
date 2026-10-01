import dekuTree from '../assets/scenes/deku-tree.webp'
import epona from '../assets/scenes/epona.webp'
import forestTall from '../assets/scenes/forest-tall.webp'
import forestWide from '../assets/scenes/forest-wide.webp'
import thumbDeku from '../assets/scenes/thumb-deku.webp'
import thumbField from '../assets/scenes/thumb-field.webp'
import thumbForest from '../assets/scenes/thumb-forest.webp'

export type SceneId = 'forest' | 'deku' | 'field'

export interface Scene {
  id: SceneId
  name: string
  caption: string
  src: string
  /** Portrait crop served to tall phone screens, when one exists. */
  tallSrc?: string
  thumb: string
  /** CSS object-position on wide screens, then on squarer ones, tuned so Link stays in frame. */
  position: string
  positionNarrow: string
}

export const SCENES: readonly Scene[] = [
  {
    id: 'forest',
    name: 'Kokiri Forest',
    caption: 'Where the journey begins',
    src: forestWide,
    tallSrc: forestTall,
    thumb: thumbForest,
    position: '100% 50%',
    positionNarrow: '10% 50%',
  },
  {
    id: 'deku',
    name: 'Great Deku Tree',
    caption: 'The guardian of the forest',
    src: dekuTree,
    thumb: thumbDeku,
    position: '50% 60%',
    positionNarrow: '50% 60%',
  },
  {
    id: 'field',
    name: 'Hyrule Field',
    caption: 'Death Mountain on the horizon',
    src: epona,
    thumb: thumbField,
    position: '100% 50%',
    positionNarrow: '5% 50%',
  },
]

export const SCENE_IDS = SCENES.map((s) => s.id)
