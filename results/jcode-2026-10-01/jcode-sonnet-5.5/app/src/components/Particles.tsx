import { useEffect, useRef } from 'react'
import './Particles.css'

export interface ParticleInputs {
  rain: boolean
  day: boolean
  /** Bumps to spawn a burst of green fireflies. */
  burst: number
  /** 0..1 */
  tension: number
  /** Bumps to fire a lightning flash on demand. */
  flash: number
}

interface Fly {
  x: number
  y: number
  r: number
  phase: number
  speed: number
  drift: number
  hue: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
}

const GLOW = 64

/** A soft radial sprite, drawn once and stamped for every firefly. */
function makeGlow(color: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = c.height = GLOW
  const g = c.getContext('2d')
  if (!g) return c
  const grad = g.createRadialGradient(GLOW / 2, GLOW / 2, 0, GLOW / 2, GLOW / 2, GLOW / 2)
  grad.addColorStop(0, `rgb(${color} / 1)`)
  grad.addColorStop(0.22, `rgb(${color} / 0.55)`)
  grad.addColorStop(1, `rgb(${color} / 0)`)
  g.fillStyle = grad
  g.fillRect(0, 0, GLOW, GLOW)
  return c
}

/**
 * One full-screen canvas for ambient life: fireflies, rain, lightning and the
 * Saria's Song burst. Inputs flow through a ref so changes never re-create the loop.
 */
export function Particles(props: ParticleInputs) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputs = useRef(props)

  useEffect(() => {
    inputs.current = props
  }, [props])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const gold = makeGlow('255 226 140')
    const green = makeGlow('150 255 190')
    const blue = makeGlow('190 235 255')

    let w = 0
    let h = 0
    let dpr = 1
    let flies: Fly[] = []
    const sparks: Spark[] = []
    const drops: { x: number; y: number; v: number; len: number }[] = []
    let lightning = 0
    let nextBolt = performance.now() + 4000
    let lastBurst = inputs.current.burst
    let lastFlash = inputs.current.flash
    let lastRain = inputs.current.rain
    let rainLevel = 0

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(70, Math.max(26, (w * h) / 22000)))
      flies = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.35 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
        drift: 8 + Math.random() * 26,
        hue: Math.random(),
      }))
      drops.length = 0
      const dropCount = Math.round(Math.min(260, w / 5))
      for (let i = 0; i < dropCount; i++) {
        drops.push({ x: Math.random() * (w + 200) - 100, y: Math.random() * h, v: 700 + Math.random() * 500, len: 10 + Math.random() * 18 })
      }
    }
    resize()
    window.addEventListener('resize', resize)

    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const inp = inputs.current
      ctx.clearRect(0, 0, w, h)

      if (inp.burst !== lastBurst) {
        lastBurst = inp.burst
        for (let i = 0; i < 90; i++) {
          const a = Math.random() * Math.PI * 2
          const s = 80 + Math.random() * 380
          sparks.push({ x: w / 2, y: h * 0.55, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90, life: 0, max: 1.4 + Math.random() * 1.6 })
        }
      }
      if (inp.flash !== lastFlash) {
        lastFlash = inp.flash
        lightning = 1
      }
      if (inp.rain !== lastRain) {
        lastRain = inp.rain
        if (inp.rain) nextBolt = now + 900
      }

      ctx.globalCompositeOperation = 'lighter'
      const t = now / 1000
      const energy = 1 + inp.tension * 0.9
      for (const f of flies) {
        const px = f.x + Math.sin(t * f.speed + f.phase) * f.drift
        const py = f.y + Math.cos(t * f.speed * 0.8 + f.phase * 1.7) * f.drift * 0.7 - ((t * f.speed * 6) % (h + 40))
        const y = ((py % (h + 40)) + h + 40) % (h + 40) - 20
        const pulse = 0.45 + 0.55 * Math.sin(t * (0.9 + f.speed) * energy + f.phase)
        const alpha = Math.max(0, pulse) * (inp.day ? 0.45 : 0.9) * (inp.rain ? 0.35 : 1)
        const size = 10 + f.r * 22
        ctx.globalAlpha = alpha
        ctx.drawImage(f.hue > 0.82 ? blue : f.hue > 0.35 ? gold : green, px - size / 2, y - size / 2, size, size)
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        if (!s) continue
        s.life += dt
        if (s.life > s.max) {
          sparks.splice(i, 1)
          continue
        }
        s.vx *= 1 - dt * 0.9
        s.vy = s.vy * (1 - dt * 0.9) - 20 * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        const k = 1 - s.life / s.max
        ctx.globalAlpha = k
        const size = 14 + 24 * k
        ctx.drawImage(green, s.x - size / 2, s.y - size / 2, size, size)
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'

      // Rain eases in and out instead of snapping.
      rainLevel += ((inp.rain ? 1 : 0) - rainLevel) * Math.min(1, dt * 2.2)
      if (rainLevel > 0.01) {
        ctx.strokeStyle = `rgba(190, 215, 235, ${0.38 * rainLevel})`
        ctx.lineWidth = 1
        ctx.beginPath()
        for (const d of drops) {
          d.y += d.v * dt
          d.x -= d.v * dt * 0.18
          if (d.y > h) {
            d.y = -d.len
            d.x = Math.random() * (w + 200) - 60
          }
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x + d.len * 0.18, d.y - d.len)
        }
        ctx.stroke()
        if (!reduce && inp.rain && now > nextBolt) {
          lightning = 1
          nextBolt = now + 5000 + Math.random() * 9000
        }
      }
      if (lightning > 0.01) {
        ctx.fillStyle = `rgba(215, 232, 255, ${lightning * 0.32})`
        ctx.fillRect(0, 0, w, h)
        // A double flicker feels like a real strike.
        lightning *= lightning > 0.55 ? 0.9 : 0.86
        if (lightning < 0.45 && lightning > 0.4 && Math.random() < 0.25) lightning = 0.9
      }

      raf = requestAnimationFrame(frame)
    }

    if (reduce) {
      // One still frame of fireflies, no loop.
      frame(performance.now())
      cancelAnimationFrame(raf)
    } else {
      raf = requestAnimationFrame(frame)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="particles" aria-hidden="true" />
}
