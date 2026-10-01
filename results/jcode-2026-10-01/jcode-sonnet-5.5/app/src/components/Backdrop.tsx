import { SCENES } from '../data/scenes'
import type { SceneId } from '../data/scenes'
import './Backdrop.css'

interface Props {
  scene: SceneId
  day: boolean
}

/**
 * Full-bleed scenery. All scenes stay mounted and cross-fade, so switching never
 * waits on a network or decode. Only the first is eager.
 */
export function Backdrop({ scene, day }: Props) {
  return (
    <div className="backdrop" data-day={day} aria-hidden="true">
      {SCENES.map((s, i) => (
        <div className="backdrop__scene" data-active={s.id === scene} key={s.id}>
          <picture>
            {s.tallSrc && <source media="(max-aspect-ratio: 3/4)" srcSet={s.tallSrc} />}
            <img
              className="backdrop__img"
              src={s.src}
              alt=""
              style={{ '--pos': s.position, '--pos-narrow': s.positionNarrow } as React.CSSProperties}
              decoding="async"
              fetchPriority={i === 0 ? 'high' : 'low'}
            />
          </picture>
        </div>
      ))}
      <div className="backdrop__grade" />
      <div className="backdrop__scrim" />
      <div className="backdrop__vignette" />
      <div className="backdrop__grain" />
    </div>
  )
}
