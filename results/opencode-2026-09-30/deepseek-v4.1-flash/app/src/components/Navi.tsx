import { useEffect, useRef, useState, type RefObject } from 'react'
import { playChime } from '../lib/audio'
import styles from './Navi.module.css'

type NaviProps = {
  boundsRef: RefObject<HTMLElement | null>
  reduced: boolean
  soundOn: boolean
  onEnableSound: () => void
  days: number
  released: boolean
}

const WHISPERS = [
  'Hey! Listen!',
  'Look! The clock is ticking!',
  'We have to save Hyrule!',
  'The legend is almost here...',
  'Did you hear that?',
]

function whisper(days: number, released: boolean): string {
  if (released) return 'It is time. Hyrule is waiting!'
  if (days === 1) return 'Tomorrow! One more sleep!'
  return WHISPERS[Math.floor(Math.random() * WHISPERS.length)]
}

/**
 * Navi: a fairy that follows the pointer around the hero, or wanders on her
 * own when the pointer is idle. Click her for a chime and a whisper.
 */
export function Navi({ boundsRef, reduced, soundOn, onEnableSound, days, released }: NaviProps) {
  const naviRef = useRef<HTMLButtonElement>(null)
  const [line, setLine] = useState<string | null>(null)
  const [burst, setBurst] = useState(0)
  const lineTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (reduced) return
    const navi = naviRef.current
    const bounds = boundsRef.current
    if (!navi || !bounds) return

    const position = { x: 0, y: 0 }
    const pointer = { x: 0, y: 0, active: false }
    let frame = 0
    let started = false

    const onPointerMove = (event: PointerEvent) => {
      const rect = bounds.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      pointer.active = true
    }
    const onPointerLeave = () => {
      pointer.active = false
    }

    const place = (time: number) => {
      frame = window.requestAnimationFrame(place)
      const width = bounds.clientWidth
      const height = bounds.clientHeight
      if (!started) {
        position.x = width * 0.72
        position.y = height * 0.34
        started = true
      }

      let targetX: number
      let targetY: number
      if (pointer.active) {
        targetX = pointer.x + 26
        targetY = pointer.y - 34
      } else {
        // Idle: drift around the upper right, away from the copy.
        const t = time * 0.00016
        targetX = width * 0.74 + Math.sin(t) * width * 0.12 + Math.sin(t * 2.3) * width * 0.03
        targetY = height * 0.2 + Math.cos(t * 1.4) * height * 0.1
      }

      const margin = 40
      targetX = Math.min(width - margin, Math.max(margin, targetX))
      targetY = Math.min(height - margin, Math.max(margin, targetY))

      const ease = pointer.active ? 0.055 : 0.02
      position.x += (targetX - position.x) * ease
      position.y += (targetY - position.y) * ease + Math.sin(time * 0.0021) * 0.22

      navi.style.transform = `translate3d(${position.x - 22}px, ${position.y - 22}px, 0)`
    }

    bounds.addEventListener('pointermove', onPointerMove)
    bounds.addEventListener('pointerleave', onPointerLeave)
    frame = window.requestAnimationFrame(place)

    return () => {
      window.cancelAnimationFrame(frame)
      bounds.removeEventListener('pointermove', onPointerMove)
      bounds.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [boundsRef, reduced])

  useEffect(() => () => window.clearTimeout(lineTimer.current), [])

  const handleClick = () => {
    if (!soundOn) onEnableSound()
    playChime([1567.98, 2093.0], 1.6)
    setBurst((value) => value + 1)
    setLine(whisper(days, released))
    window.clearTimeout(lineTimer.current)
    lineTimer.current = window.setTimeout(() => setLine(null), 3200)
  }

  return (
    <button
      ref={naviRef}
      type="button"
      className={styles.navi}
      onClick={handleClick}
      aria-label="Talk to Navi"
      data-wandering={!reduced}
    >
      <span key={burst} className={styles.burst} aria-hidden="true" />
      <span className={styles.orb} aria-hidden="true">
        <svg className={styles.wings} viewBox="0 0 64 44" aria-hidden="true">
          <ellipse className={styles.wingLeft} cx="20" cy="20" rx="15" ry="8" transform="rotate(-24 20 20)" />
          <ellipse className={styles.wingRight} cx="44" cy="20" rx="15" ry="8" transform="rotate(24 44 20)" />
        </svg>
        <span className={styles.core} />
      </span>
      {line && (
        <span key={line} className={styles.bubble} role="status">
          {line}
        </span>
      )}
    </button>
  )
}
