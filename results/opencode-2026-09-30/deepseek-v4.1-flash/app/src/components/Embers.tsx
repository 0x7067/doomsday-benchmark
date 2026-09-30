import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  life: number
  span: number
  seed: number
  warm: boolean
}

const WARM = 'rgba(255, 206, 138, 0.92)'
const COOL = 'rgba(170, 228, 255, 0.9)'

function makeSprite(color: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas')
  sprite.width = 64
  sprite.height = 64
  const ctx = sprite.getContext('2d')
  if (!ctx) return sprite
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  gradient.addColorStop(0.22, color)
  gradient.addColorStop(0.55, color.replace(/[\d.]+\)$/, '0.16)'))
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  return sprite
}

function spawn(width: number, height: number, initial: boolean): Particle {
  const span = 320 + Math.random() * 520
  return {
    x: Math.random() * width,
    y: initial ? Math.random() * height : height + 20 + Math.random() * 60,
    vx: (Math.random() - 0.5) * 0.16,
    vy: -(0.12 + Math.random() * 0.34),
    size: 1.6 + Math.random() * 3.6,
    life: initial ? Math.random() * span : 0,
    span,
    seed: Math.random() * Math.PI * 2,
    warm: Math.random() > 0.16,
  }
}

type EmbersProps = {
  className?: string
  reduced: boolean
}

/** Drifting embers and spirit-motes above the hero art. */
export function Embers({ className, reduced }: EmbersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (reduced) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const warm = makeSprite(WARM)
    const cool = makeSprite(COOL)
    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let running = true

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.round(Math.min(74, Math.max(20, (width * height) / 24000)))
      particles = Array.from({ length: target }, () => spawn(width, height, true))
    }

    const draw = (time: number) => {
      if (!running) return
      frame = window.requestAnimationFrame(draw)
      ctx.clearRect(0, 0, width, height)
      ctx.globalCompositeOperation = 'lighter'

      for (const particle of particles) {
        particle.life += 16.7
        if (particle.life > particle.span || particle.y < -40) {
          Object.assign(particle, spawn(width, height, false))
          continue
        }
        const progress = particle.life / particle.span
        const sway = Math.sin(time * 0.0009 + particle.seed) * 0.35
        particle.x += particle.vx + sway * 0.18
        particle.y += particle.vy

        const fade = Math.sin(Math.min(1, progress) * Math.PI)
        const flicker = 0.72 + Math.sin(time * 0.008 + particle.seed * 3) * 0.28
        const scale = particle.size * (0.6 + fade * 0.9)
        const sprite = particle.warm ? warm : cool

        ctx.globalAlpha = Math.max(0, fade * flicker * 0.85)
        ctx.drawImage(sprite, particle.x - scale * 2, particle.y - scale * 2, scale * 4, scale * 4)
      }

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false
        window.cancelAnimationFrame(frame)
      } else if (!running) {
        running = true
        frame = window.requestAnimationFrame(draw)
      }
    }

    resize()
    frame = window.requestAnimationFrame(draw)
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [reduced])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
