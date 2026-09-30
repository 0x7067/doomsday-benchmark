import { useEffect, useState } from 'react'
import { synth } from '../../lib/audio/synth'
import { usePrefersReducedMotion } from '../../lib/useMediaQuery'
import './effects.css'

/**
 * One-shot overlays. Each is keyed by a counter from the world state, so
 * bumping the counter remounts the element and replays its CSS animation.
 * A count of 0 means "never happened" and renders nothing.
 */

/**
 * The white-out of the Temple of Time, for the Song of Time and the launch.
 * The scene swaps underneath while it's brightest. `long` holds the light
 * longer, for the moment itself.
 */
export function TimeWarp({ count, long = false }: { count: number; long?: boolean }) {
  if (count === 0) return null
  return (
    <div key={count} className="time-warp" data-long={long || undefined} aria-hidden="true">
      <span className="time-warp__ring" />
      <span className="time-warp__ring time-warp__ring--late" />
    </div>
  )
}

/** Zelda's Lullaby: the three golden triangles meet. */
export function Triforce({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <div key={count} className="triforce" aria-hidden="true">
      <svg viewBox="0 0 200 174">
        <defs>
          <linearGradient id="triforce-gold" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0" stopColor="#fff8dc" />
            <stop offset="0.45" stopColor="#f0cf78" />
            <stop offset="1" stopColor="#b07a22" />
          </linearGradient>
        </defs>
        <path className="triforce__piece triforce__piece--power" d="M100 2 149 87H51Z" />
        <path className="triforce__piece triforce__piece--wisdom" d="M50 88 99 172H1Z" />
        <path className="triforce__piece triforce__piece--courage" d="M150 88 199 172H101Z" />
      </svg>
    </div>
  )
}

/** Lightning at uneven intervals while the storm lasts, each followed by thunder. */
export function Lightning({ active }: { active: boolean }) {
  const [strikes, setStrikes] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (!active) return
    let timer: number
    const strike = () => {
      setStrikes((n) => n + 1)
      synth.thunder(0.3 + Math.random() * 0.9)
      timer = window.setTimeout(strike, 5200 + Math.random() * 6500)
    }
    timer = window.setTimeout(strike, 1400)
    return () => window.clearTimeout(timer)
  }, [active])

  useEffect(() => {
    synth.setRain(active)
    return () => synth.setRain(false)
  }, [active])

  // No flashing for people who prefer reduced motion; the thunder still rolls.
  if (!active || strikes === 0 || reducedMotion) return null
  return <div key={strikes} className="lightning" aria-hidden="true" />
}
