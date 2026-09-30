import { useState } from 'react'
import logoAvif from '../assets/logo/logo.avif'
import logoWebp from '../assets/logo/logo.webp'
import { GAME_TITLE } from '../config/launch'
import './logo.css'

export function Logo() {
  // The gleam is masked to the logo's silhouette using whichever file the
  // <picture> picked, so the logo is only ever downloaded once.
  const [mask, setMask] = useState<string | null>(null)

  return (
    <h1 className="logo">
      <picture>
        <source type="image/avif" srcSet={logoAvif} />
        <img
          className="logo__image"
          src={logoWebp}
          alt={GAME_TITLE}
          width={640}
          height={478}
          fetchPriority="high"
          onLoad={(event) => setMask(event.currentTarget.currentSrc)}
        />
      </picture>
      {mask && (
        <span
          className="logo__gleam"
          aria-hidden="true"
          style={{ maskImage: `url("${mask}")`, WebkitMaskImage: `url("${mask}")` }}
        />
      )}
    </h1>
  )
}
