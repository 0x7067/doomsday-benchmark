import { useState, type CSSProperties } from 'react'
import { PORTRAIT_QUERY, SCENE_ORDER, SCENES, type Art, type Scene, type SceneId } from '../../lib/scenes/scenes'
import './backdrop.css'

interface BackdropProps {
  sceneId: SceneId
  /** Warps cut quickly under the time-warp flash instead of cross-fading slowly. */
  via: 'walk' | 'warp'
  /** Sun's Song: moonlit grade over whatever scene is showing. */
  night: boolean
  /** Song of Storms: overcast grade (the rain itself is particles). */
  storm: boolean
}

/**
 * The full-bleed art behind everything.
 *
 * The active scene loads first at high priority; once it has painted, the
 * other scenes mount invisibly so a song can switch to them instantly.
 * Switching cross-fades the incoming scene over the outgoing one, which stays
 * fully opaque underneath so the picture never dips through black.
 */
export function Backdrop({ sceneId, via, night, storm }: BackdropProps) {
  const [layers, setLayers] = useState<{ current: SceneId; previous: SceneId | null }>({
    current: sceneId,
    previous: null,
  })
  if (layers.current !== sceneId) setLayers({ current: sceneId, previous: layers.current })

  const [warm, setWarm] = useState(false)
  const mounted = SCENE_ORDER.filter((id) => warm || id === layers.current || id === layers.previous)

  return (
    <div className="backdrop" aria-hidden="true" data-via={via} data-night={night || undefined} data-storm={storm || undefined}>
      <div className="backdrop__parallax">
        {mounted.map((id) => (
          <SceneLayer
            key={id}
            scene={SCENES[id]}
            state={id === layers.current ? 'active' : id === layers.previous ? 'previous' : 'idle'}
            priority={id === layers.current && !warm}
            onLoad={id === layers.current && !warm ? () => scheduleWarmUp(() => setWarm(true)) : undefined}
            onShown={id === layers.current ? () => setLayers((l) => ({ ...l, previous: null })) : undefined}
          />
        ))}
      </div>
      <div className="backdrop__grade backdrop__grade--night" />
      <div className="backdrop__grade backdrop__grade--storm" />
      <div className="backdrop__scrim" />
    </div>
  )
}

/** Fetch the remaining scenes once the browser is idle, unless the user asked to save data. */
function scheduleWarmUp(warmUp: () => void) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  if (connection?.saveData) return
  if ('requestIdleCallback' in window) window.requestIdleCallback(warmUp, { timeout: 4000 })
  else setTimeout(warmUp, 1500)
}

interface SceneLayerProps {
  scene: Scene
  state: 'active' | 'previous' | 'idle'
  priority: boolean
  onLoad?: () => void
  /** Fired when this layer has finished fading in. */
  onShown?: () => void
}

function SceneLayer({ scene, state, priority, onLoad, onShown }: SceneLayerProps) {
  const [loaded, setLoaded] = useState(false)
  const { art, portrait } = scene
  const style = {
    '--focus': art.focus,
    '--focus-portrait': portrait?.focus ?? art.focus,
    '--scale-portrait': portrait?.scale ?? 1,
    '--placeholder': `url("${art.image.placeholder}")`,
    '--placeholder-portrait': `url("${(portrait ?? art).image.placeholder}")`,
  } as CSSProperties

  return (
    <div
      className="scene"
      data-scene={scene.id}
      data-state={state}
      data-loaded={loaded || undefined}
      style={style}
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && event.propertyName === 'opacity') onShown?.()
      }}
    >
      <picture>
        {portrait && (
          <>
            <source media={PORTRAIT_QUERY} type="image/avif" srcSet={portrait.image.avif} sizes={coverSizes(portrait)} />
            <source media={PORTRAIT_QUERY} type="image/webp" srcSet={portrait.image.webp} sizes={coverSizes(portrait)} />
          </>
        )}
        <source type="image/avif" srcSet={art.image.avif} sizes={coverSizes(art)} />
        <source type="image/webp" srcSet={art.image.webp} sizes={coverSizes(art)} />
        <img
          className="scene__image"
          src={art.image.src}
          alt=""
          decoding="async"
          fetchPriority={priority ? 'high' : 'low'}
          onLoad={() => {
            setLoaded(true)
            onLoad?.()
          }}
        />
      </picture>
    </div>
  )
}

/**
 * `sizes` for an image drawn with `object-fit: cover` over the viewport:
 * it spans the full width on screens wider than the art, and overflows it
 * (height × aspect) on narrower ones. Padded ~8% for the parallax and drift zoom.
 */
function coverSizes({ aspect }: Art): string {
  const ratio = `${Math.round(aspect * 1000)}/1000`
  return `(min-aspect-ratio: ${ratio}) 108vw, ${Math.ceil(aspect * 108)}vh`
}
