/** The fixed scene: night artwork with a dawn layer that fades in at zero. */
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="backdrop-parallax">
        <div className="backdrop-scenes">
          <picture className="scene scene-night">
            <source media="(max-width: 719px)" srcSet="/images/forest-poster.avif" />
            <img
              src="/images/forest-night.avif"
              alt=""
              draggable={false}
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          <picture className="scene scene-dawn">
            <img src="/images/dawn.avif" alt="" draggable={false} decoding="async" />
          </picture>
        </div>
      </div>
      <div className="fog fog-a" />
      <div className="fog fog-b" />
      <div className="vignette" />
      <div className="grain" />
    </div>
  )
}
