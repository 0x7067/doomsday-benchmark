import { useCallback, useEffect, useRef, useState } from 'react'
import { ocarinaAudio } from '../audio'
import './Navi.css'

const TIPS = [
  'Hey! Listen! Press the arrow keys and A to play the ocarina.',
  'Try the Song of Time: Right, A, Down, Right, A, Down.',
  'Open the songbook and I will teach you everything.',
  'Look! The weather answers the Song of Storms.',
  'Watch out! Time is moving faster than it looks.',
]

/**
 * Navi hovers beside the clock and leans towards the pointer. Click or tap her for a tip.
 */
export function Navi() {
  const homeRef = useRef<HTMLButtonElement>(null)
  const [tip, setTip] = useState<{ n: number; text: string } | null>(null)
  const nextTip = useRef(0)
  const hide = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const el = homeRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    let raf = 0
    const frame = (now: number) => {
      x += (tx - x) * 0.05
      y += (ty - y) * 0.05
      const bob = Math.sin(now / 700) * 7
      const sway = Math.cos(now / 1100) * 9
      el.style.transform = `translate3d(${(x + sway).toFixed(1)}px, ${(y + bob).toFixed(1)}px, 0)`
      raf = requestAnimationFrame(frame)
    }
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const hx = r.left + r.width / 2 - x
      const hy = r.top + r.height / 2 - y
      tx = (e.clientX - hx) * 0.16
      ty = (e.clientY - hy) * 0.16
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(frame)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  useEffect(() => () => clearTimeout(hide.current), [])

  const onClick = useCallback(() => {
    ocarinaAudio.chime()
    const n = nextTip.current++
    setTip({ n, text: TIPS[n % TIPS.length] ?? '' })
    clearTimeout(hide.current)
    hide.current = setTimeout(() => setTip(null), 5200)
  }, [])

  return (
    <div className="navi">
      <button ref={homeRef} type="button" className="navi__orb" onClick={onClick} aria-label="Navi. Ask for a tip.">
        <span className="navi__wing navi__wing--l" />
        <span className="navi__wing navi__wing--r" />
        <span className="navi__core" />
      </button>
      {tip && (
        <p className="navi__tip" key={tip.n} role="status">
          {tip.text}
        </p>
      )}
    </div>
  )
}
