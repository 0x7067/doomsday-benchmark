import { SCENES } from '../data/scenes'
import type { SceneId } from '../data/scenes'
import './SceneSwitcher.css'

interface Props {
  scene: SceneId
  onSelect: (id: SceneId) => void
}

export function SceneSwitcher({ scene, onSelect }: Props) {
  return (
    <div className="scenes" role="radiogroup" aria-label="Scenery">
      {SCENES.map((s) => (
        <button
          type="button"
          role="radio"
          aria-checked={s.id === scene}
          className="scenes__item"
          key={s.id}
          onClick={() => onSelect(s.id)}
          title={s.name}
        >
          <img src={s.thumb} alt="" width={96} height={54} />
          <span className="scenes__name">{s.name}</span>
        </button>
      ))}
    </div>
  )
}
