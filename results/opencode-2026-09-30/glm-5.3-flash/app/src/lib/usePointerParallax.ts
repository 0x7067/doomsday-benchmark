import { useEffect, useRef } from 'react'

/**
 * Tracks the pointer and eases `--px` / `--py` custom properties (each in
 * [-1, 1]) onto the referenced element. Layers compose their own parallax
 * depth via calc() in CSS, so a single write per frame drives every layer.
 * Disabled for touch-only devices and reduced-motion users.
 */
export function usePointerParallax<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.matchMedia('(pointer: coarse)').matches) return

    let targetX = 0
    let targetY = 0
    let x = 0
    let y = 0
    let raf = 0
    let animating = false

    const step = () => {
      x += (targetX - x) * 0.055
      y += (targetY - y) * 0.055
      element.style.setProperty('--px', x.toFixed(4))
      element.style.setProperty('--py', y.toFixed(4))
      if (Math.abs(targetX - x) < 0.001 && Math.abs(targetY - y) < 0.001) {
        animating = false
        return
      }
      raf = requestAnimationFrame(step)
    }

    const wake = () => {
      if (animating) return
      animating = true
      raf = requestAnimationFrame(step)
    }

    const onMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth) * 2 - 1
      targetY = (event.clientY / window.innerHeight) * 2 - 1
      wake()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return ref
}
