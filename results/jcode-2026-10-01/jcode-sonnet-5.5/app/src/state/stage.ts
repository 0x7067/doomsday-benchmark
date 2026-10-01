import type { SceneId } from '../data/scenes'
import type { SongId } from '../data/songs'

/** Everything the ocarina songs (and the arrival of the moment) can change about the page. */
export interface Stage {
  scene: SceneId
  /** Sun's Song: lifts the gloom. */
  day: boolean
  /** Song of Storms. */
  rain: boolean
  /** Song of Time: hundredths of a second are showing. */
  slowTime: boolean
  /** Counters that retrigger one-shot effects. */
  pulse: number
  burst: number
  flash: number
  /** Most recent song, for the toast. `id` is a nonce so repeats retrigger it. */
  toast: { id: number; song: SongId } | null
  learned: readonly SongId[]
}

export const initialStage: Stage = {
  scene: 'forest',
  day: false,
  rain: false,
  slowTime: false,
  pulse: 0,
  burst: 0,
  flash: 0,
  toast: null,
  learned: [],
}

export type StageAction =
  | { type: 'song'; song: SongId; nonce: number }
  | { type: 'scene'; scene: SceneId }
  | { type: 'slow-time-ended' }
  | { type: 'toast-cleared'; nonce: number }
  | { type: 'arrival' }

function applySong(state: Stage, song: SongId): Stage {
  switch (song) {
    case 'time':
      return { ...state, slowTime: true }
    case 'lullaby':
      return { ...state, pulse: state.pulse + 1 }
    case 'saria':
      return { ...state, scene: 'forest', burst: state.burst + 1 }
    case 'epona':
      return { ...state, scene: 'field' }
    case 'sun':
      return { ...state, day: !state.day }
    case 'storms':
      return { ...state, rain: !state.rain }
  }
}

export function stageReducer(state: Stage, action: StageAction): Stage {
  switch (action.type) {
    case 'scene':
      return { ...state, scene: action.scene }
    case 'slow-time-ended':
      return { ...state, slowTime: false }
    case 'toast-cleared':
      return state.toast?.id === action.nonce ? { ...state, toast: null } : state
    case 'arrival':
      return { ...state, burst: state.burst + 1, flash: state.flash + 1, rain: false, slowTime: false }
    case 'song': {
      const next = applySong(state, action.song)
      return {
        ...next,
        toast: { id: action.nonce, song: action.song },
        learned: state.learned.includes(action.song) ? state.learned : [...state.learned, action.song],
      }
    }
  }
}
