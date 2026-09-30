import { SCENE_ORDER, SCENES, type SceneId } from '../../lib/scenes/scenes'
import './places.css'

interface PlacesProps {
  current: SceneId
  onVisit(sceneId: SceneId): void
}

/** Direct travel between scenes, for anyone who'd rather not learn the songs. */
export function Places({ current, onVisit }: PlacesProps) {
  return (
    <nav className="places" aria-label="Places">
      <ul className="places__list">
        {SCENE_ORDER.map((id) => (
          <li key={id}>
            <button
              type="button"
              className="places__place"
              aria-current={id === current ? 'true' : undefined}
              onClick={() => onVisit(id)}
            >
              {SCENES[id].name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
