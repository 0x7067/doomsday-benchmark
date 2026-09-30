import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../lib/useClock.ts'
import styles from './NaviMotes.module.css'

interface Mote {
  x: number
  y: number
  /** Radius in CSS pixels. */
  r: number
  /** Drift, pixels per second. */
  vx: number
  vy: number
  /** Sway frequency and amplitude. */
  swayHz: number
  swayPx: number
  phase: number
  /** Twinkle rate. */
  blinkHz: number
  /** 0 = mint, 1 = gold. */
  warmth: number
  /** 0 = far, out of focus. 1 = near. */
  depth: number
}

const MOTE_COUNT = 72

/**
 * Navi's lights: a slow drift of glowing motes across the viewport.
 *
 * One canvas, one animation frame, no React involvement after mount. The sprite
 * is pre-rendered once so each mote is a single `drawImage` rather than a
 * per-frame gradient — the difference between 60fps and 25 on a laptop.
 */
export function NaviMotes() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return

    const buildSprite = (tint: readonly [number, number, number]) => {
      const size = 64
      const off = document.createElement('canvas')
      off.width = size
      off.height = size
      const ctx = off.getContext('2d')
      if (!ctx) return null
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
      gradient.addColorStop(0, `rgb(${tint[0]} ${tint[1]} ${tint[2]})`)
      gradient.addColorStop(0.24, `rgb(${tint[0]} ${tint[1]} ${tint[2]} / 0.5)`)
      gradient.addColorStop(0.6, `rgb(${tint[0]} ${tint[1]} ${tint[2]} / 0.1)`)
      gradient.addColorStop(1, `rgb(${tint[0]} ${tint[1]} ${tint[2]} / 0)`)
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, size, size)
      return off
    }

    const sprites = [buildSprite([190, 255, 222]), buildSprite([255, 226, 150])]

    let width = 0
    let height = 0
    let dpr = 1
    let frame = 0
    let running = false
    const motes: Mote[] = []
    let start = performance.now()
    let last = start

    const seed = () => {
      motes.length = 0
      for (let i = 0; i < MOTE_COUNT; i += 1) {
        const depth = Math.random()
        motes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.9 + depth * 4.8,
          vx: (Math.random() - 0.5) * 10 * (0.3 + depth),
          vy: -(3 + Math.random() * 10) * (0.35 + depth),
          swayHz: 0.05 + Math.random() * 0.2,
          swayPx: 6 + Math.random() * 30,
          phase: Math.random() * Math.PI * 2,
          blinkHz: 0.16 + Math.random() * 0.66,
          warmth: Math.random() < 0.22 ? 1 : 0,
          depth,
        })
      }
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      canvas!.style.width = `${width}px`
      canvas!.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
    }

    /** One pass. `delta` of 0 gives a still frame. */
    const draw = (timestamp: number, delta: number) => {
      const elapsed = (timestamp - start) / 1000

      context.clearRect(0, 0, width, height)
      context.globalCompositeOperation = 'lighter'

      for (const mote of motes) {
        if (delta > 0) {
          mote.x +=
            (mote.vx + Math.cos(elapsed * mote.swayHz * Math.PI * 2 + mote.phase) * mote.swayPx * 0.14) * delta
          mote.y += mote.vy * delta
          // Wrap rather than respawn, so density stays even.
          if (mote.y < -24) {
            mote.y = height + 24
            mote.x = Math.random() * width
          }
          if (mote.x < -36) mote.x = width + 36
          if (mote.x > width + 36) mote.x = -36
        }

        const twinkle = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(elapsed * mote.blinkHz * Math.PI * 2 + mote.phase))
        const sprite = sprites[mote.warmth]
        if (!sprite) continue
        const size = mote.r * 9
        context.globalAlpha = twinkle * (0.14 + mote.depth * 0.46)
        context.drawImage(sprite, mote.x - size / 2, mote.y - size / 2, size, size)
      }

      context.globalAlpha = 1
      context.globalCompositeOperation = 'source-over'
    }

    const loop = (timestamp: number) => {
      if (!running) return
      const delta = Math.min(0.05, (timestamp - last) / 1000)
      last = timestamp
      draw(timestamp, delta)
      frame = requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })

    if (reduced) {
      // One still frame: a quiet, sparse field rather than no field at all.
      draw(start, 0)
    } else {
      running = true
      frame = requestAnimationFrame(loop)
    }

    /**
     * Fade the field out as the hero leaves. Scroll-linked, so it is a direct
     * answer to the reader's own input rather than autonomous motion.
     */
    const setPresence = () => {
      const limit = Math.max(240, window.innerHeight * 0.9)
      const t = Math.min(1, Math.max(0, window.scrollY / limit))
      canvas!.style.setProperty('--presence', (1 - t * 0.62).toFixed(3))
    }

    let presenceFrame = 0
    const onScroll = () => {
      if (presenceFrame) return
      presenceFrame = requestAnimationFrame(() => {
        presenceFrame = 0
        setPresence()
      })
    }

    const onVisibility = () => {
      if (reduced) return
      if (document.visibilityState === 'hidden') {
        running = false
        cancelAnimationFrame(frame)
      } else if (!running) {
        running = true
        last = performance.now()
        frame = requestAnimationFrame(loop)
      }
    }

    setPresence()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(frame)
      if (presenceFrame) cancelAnimationFrame(presenceFrame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}
