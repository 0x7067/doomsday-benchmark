import { useEffect, useRef } from 'react'

interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  phase: number
  twinkleHz: number
  swayHz: number
  brightness: number
  sprite: HTMLCanvasElement
}

function makeSprite(r: number, g: number, b: number): HTMLCanvasElement {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, 1)`)
  glow.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.45)`)
  glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, size, size)
  return canvas
}

const SPRITES = [
  makeSprite(232, 208, 128), // gold, like a firefly over Hyrule Field
  makeSprite(176, 224, 152), // pale green, like a forest fairy
]

/** Fireflies drifting up through the scene, gently avoiding the pointer. */
export function Fireflies() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let width = 0
    let height = 0
    let motes: Mote[] = []

    const spawn = (): Mote => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 9,
      vy: -(5 + Math.random() * 10),
      radius: 1 + Math.random() * 1.7,
      phase: Math.random() * Math.PI * 2,
      twinkleHz: 0.12 + Math.random() * 0.4,
      swayHz: 0.05 + Math.random() * 0.12,
      brightness: 0.35 + Math.random() * 0.5,
      sprite: SPRITES[Math.random() < 0.72 ? 0 : 1],
    })

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(70, Math.max(24, (width * height) / 42_000)))
      motes = Array.from({ length: count }, spawn)
    }

    const pointer = { x: -10_000, y: -10_000 }
    const onMove = (event: PointerEvent) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
    }

    let raf = 0
    let last = performance.now()
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      ctx.clearRect(0, 0, width, height)

      for (const mote of motes) {
        mote.phase += mote.twinkleHz * dt * Math.PI * 2
        mote.x += (mote.vx + Math.sin((t / 1000) * mote.swayHz * Math.PI * 2 + mote.phase) * 5) * dt
        mote.y += mote.vy * dt

        const dx = mote.x - pointer.x
        const dy = mote.y - pointer.y
        const distance = Math.hypot(dx, dy)
        if (distance < 120 && distance > 0.01) {
          const push = (1 - distance / 120) * 30 * dt
          mote.x += (dx / distance) * push
          mote.y += (dy / distance) * push
        }

        if (mote.y < -24) {
          mote.y = height + 20
          mote.x = Math.random() * width
        }
        if (mote.x < -24) mote.x = width + 20
        else if (mote.x > width + 24) mote.x = -20

        const twinkle = 0.5 + 0.5 * Math.sin(mote.phase)
        const radius = mote.radius * (0.8 + 0.45 * twinkle)
        ctx.globalAlpha = mote.brightness * (0.22 + 0.78 * twinkle)
        ctx.drawImage(mote.sprite, mote.x - radius * 3, mote.y - radius * 3, radius * 6, radius * 6)
      }

      ctx.globalAlpha = 1
      raf = requestAnimationFrame(frame)
    }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} className="fireflies" aria-hidden="true" />
}
