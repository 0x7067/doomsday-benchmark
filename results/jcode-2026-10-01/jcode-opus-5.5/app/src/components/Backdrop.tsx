import { memo, useCallback, useEffect, useState } from 'react'
import { SCENES } from '../art'
import type { SceneId } from '../lib/world'

interface Layer {
  id: number
  scene: SceneId
}

/**
 * Full-bleed scene art. When the scene changes the new image is stacked on top
 * and fades in once decoded, then the old layer is dropped, so a scene change
 * never flashes an empty frame. Wide art for landscape screens, tall crops for
 * portrait ones, chosen by `<picture>` media queries.
 */
export const Backdrop = memo(function Backdrop({ scene }: { scene: SceneId }) {
  const [layers, setLayers] = useState<Layer[]>([{ id: 0, scene }])
  // Stable, so the per-second re-render of the page doesn't restart the fade timer.
  const dropOld = useCallback(() => setLayers((ls) => ls.slice(-1)), [])

  // Adjusting state during render (not in an effect) is React's recommended
  // way to derive "a new layer arrived" from a prop change.
  const top = layers[layers.length - 1]
  if (top.scene !== scene) setLayers([...layers.slice(-1), { id: top.id + 1, scene }])

  return (
    <div className="backdrop" aria-hidden="true">
      {layers.map((layer, i) => (
        <SceneImage key={layer.id} scene={layer.scene} entering={i > 0} onShown={dropOld} />
      ))}
    </div>
  )
})

function SceneImage({ scene, entering, onShown }: { scene: SceneId; entering: boolean; onShown: () => void }) {
  const art = SCENES[scene]
  const [loaded, setLoaded] = useState(false)

  // Once the new layer has faded in (matches the CSS transition), the layer
  // underneath can go.
  useEffect(() => {
    if (!loaded || !entering) return
    const t = window.setTimeout(onShown, 1800)
    return () => window.clearTimeout(t)
  }, [loaded, entering, onShown])

  return (
    <picture
      className="backdrop__layer"
      data-loaded={loaded || undefined}
      style={{
        backgroundImage: `url(${art.placeholder})`,
        ['--focus-wide' as string]: art.focus.wide,
        ['--focus-tall' as string]: art.focus.tall,
      }}
    >
      <source media="(max-aspect-ratio: 2/3)" srcSet={art.tall} sizes="100vw" />
      <source srcSet={art.wide} sizes="100vw" />
      <img
        src={art.src}
        alt=""
        decoding="async"
        fetchPriority={entering ? 'auto' : 'high'}
        ref={(img) => {
          // Cached images may already be complete before onLoad is attached.
          if (img?.complete && img.naturalWidth > 0 && !loaded) setLoaded(true)
        }}
        onLoad={() => setLoaded(true)}
      />
    </picture>
  )
}
