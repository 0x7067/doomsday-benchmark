import { useState } from 'react'
import type { Scene } from '../../lib/scenes/scenes'
import './area-card.css'

/**
 * The game's area title card: the place name fades up, holds, and fades
 * away whenever you arrive somewhere new. Not shown for the opening scene.
 */
export function AreaCard({ scene }: { scene: Scene }) {
  const [seen, setSeen] = useState({ id: scene.id, arrivals: 0 })
  if (seen.id !== scene.id) setSeen({ id: scene.id, arrivals: seen.arrivals + 1 })
  if (seen.arrivals === 0) return null

  return (
    <div key={seen.arrivals} className="area-card" aria-hidden="true">
      <p className="area-card__name">{scene.name}</p>
      <p className="area-card__subtitle">{scene.subtitle}</p>
    </div>
  )
}
