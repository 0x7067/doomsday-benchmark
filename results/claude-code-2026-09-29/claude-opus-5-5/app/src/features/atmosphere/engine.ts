import { pointer } from '../../lib/pointer'
import type { Atmosphere } from '../../lib/scenes/scenes'

/**
 * A small canvas particle system for the air in each scene: fireflies in the
 * forest, falling leaves at the Great Deku Tree, drifting pollen on Hyrule
 * Field, rain for the Song of Storms, and bursts of sparks for big moments.
 *
 * Framework-free on purpose: React only configures it. Populations ease
 * toward their targets (particles fade in and out), so changing scene or
 * weather never pops.
 */

type Kind = 'firefly' | 'leaf' | 'mote' | 'rain' | 'spark'

interface Particle {
  kind: Kind
  x: number
  y: number
  vx: number
  vy: number
  size: number
  /** Random per particle, drives wander and blink. */
  seed: number
  angle: number
  spin: number
  /** 0 → 1 fade-in; decreases while `dying`. */
  presence: number
  dying: boolean
  /** Sparks only: seconds lived and lifetime. */
  age: number
  ttl: number
  color: number
}

export interface AtmosphereConfig {
  mode: Atmosphere
  night: boolean
  rain: boolean
}

/** Particles per 100,000 px² of canvas. */
function densities({ mode, night, rain }: AtmosphereConfig): Record<Exclude<Kind, 'spark'>, number> {
  const glow = night ? 1.9 : 1
  return {
    firefly: (mode === 'fireflies' ? 2.4 : mode === 'leaves' ? 1.1 : 0.4) * glow * (rain ? 0.35 : 1),
    leaf: mode === 'leaves' ? (rain ? 0.6 : 1.3) : 0,
    mote: mode === 'pollen' ? (rain ? 0.5 : 3.4) : mode === 'fireflies' ? 0.8 : 0,
    rain: rain ? 13 : 0,
  }
}

const LEAF_COLORS = ['#7d3219', '#9c4420', '#6a2a14', '#b35c2a', '#8a5a22']
const SPARK_COLORS = ['#fff6d6', '#f7e0a0', '#e6f6ff']

function glowSprite(inner: string, outer: string): HTMLCanvasElement {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, inner)
  gradient.addColorStop(0.18, inner)
  gradient.addColorStop(0.42, outer)
  gradient.addColorStop(1, 'rgb(0 0 0 / 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  return canvas
}

export class AtmosphereEngine {
  private ctx: CanvasRenderingContext2D
  private particles: Particle[] = []
  private config: AtmosphereConfig = { mode: 'fireflies', night: false, rain: false }
  private width = 0
  private height = 0
  private frame = 0
  private last = 0
  private running = false
  private sprites: Record<'firefly' | 'mote' | 'spark' | 'navi', HTMLCanvasElement>
  private resizeObserver: ResizeObserver
  private canvas: HTMLCanvasElement

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.sprites = {
      firefly: glowSprite('rgb(246 255 190 / 1)', 'rgb(170 230 90 / 0.35)'),
      mote: glowSprite('rgb(255 246 230 / 0.9)', 'rgb(255 214 190 / 0.18)'),
      spark: glowSprite('rgb(255 250 230 / 1)', 'rgb(247 210 120 / 0.4)'),
      navi: glowSprite('rgb(245 252 255 / 1)', 'rgb(140 205 255 / 0.45)'),
    }
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    this.resize()
  }

  configure(config: AtmosphereConfig) {
    this.config = config
  }

  /** A burst of sparks from a point in CSS pixels, e.g. when a song is completed. */
  burst(x: number, y: number, count = 60, spread = 1) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = (90 + Math.random() * 340) * spread
      this.particles.push({
        ...this.blank('spark'),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        size: 3 + Math.random() * 7,
        ttl: 1.1 + Math.random() * 1.5,
        color: Math.floor(Math.random() * SPARK_COLORS.length),
        presence: 1,
      })
    }
    this.start()
  }

  start() {
    if (this.running) return
    this.running = true
    this.last = performance.now()
    this.frame = requestAnimationFrame(this.tick)
  }

  stop() {
    this.running = false
    cancelAnimationFrame(this.frame)
  }

  destroy() {
    this.stop()
    this.resizeObserver.disconnect()
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect()
    // Soft glows don't need retina density; cap the backing store near 4 MP so
    // big high-DPI screens don't clear and redraw 15 MP every frame.
    const budget = Math.sqrt(4_000_000 / Math.max(1, rect.width * rect.height))
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, budget))
    this.width = rect.width
    this.height = rect.height
    this.canvas.width = Math.round(rect.width * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private blank(kind: Kind): Particle {
    return {
      kind,
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: 0,
      vy: 0,
      size: 1,
      seed: Math.random() * 1000,
      angle: Math.random() * Math.PI * 2,
      spin: 0,
      presence: 0,
      dying: false,
      age: 0,
      ttl: Infinity,
      color: 0,
    }
  }

  private spawn(kind: Exclude<Kind, 'spark'>): Particle {
    const p = this.blank(kind)
    switch (kind) {
      case 'firefly':
        p.size = 5 + Math.random() * 9
        p.vx = (Math.random() - 0.5) * 16
        p.vy = (Math.random() - 0.5) * 16
        break
      case 'leaf':
        p.y = -20 - Math.random() * this.height * 0.5
        p.size = 5 + Math.random() * 6
        p.vy = 28 + Math.random() * 38
        p.spin = (Math.random() - 0.5) * 3
        p.color = Math.floor(Math.random() * LEAF_COLORS.length)
        break
      case 'mote':
        p.size = 2 + Math.random() * 4
        p.vx = 8 + Math.random() * 22
        p.vy = -2 - Math.random() * 6
        break
      case 'rain':
        p.y = Math.random() * this.height - this.height
        p.size = 14 + Math.random() * 18
        p.vy = 950 + Math.random() * 450
        p.vx = p.vy * 0.2
        p.presence = 1
        break
    }
    return p
  }

  /** Grow or shrink each population toward its density target. */
  private balance() {
    const area = (this.width * this.height) / 100_000
    const targets = densities(this.config)
    for (const kind of Object.keys(targets) as (keyof typeof targets)[]) {
      const target = Math.round(targets[kind] * area)
      const living = this.particles.filter((p) => p.kind === kind && !p.dying)
      if (living.length < target) {
        // Spawn gradually so a new mode fades in rather than appearing at once.
        const add = Math.min(target - living.length, kind === 'rain' ? 12 : 2)
        for (let i = 0; i < add; i++) this.particles.push(this.spawn(kind))
      } else if (living.length > target) {
        for (const p of living.slice(target)) p.dying = true
      }
    }
  }

  private tick = (now: number) => {
    if (!this.running) return
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    this.balance()
    this.update(dt, now / 1000)
    this.draw(now / 1000)
    this.frame = requestAnimationFrame(this.tick)
  }

  private update(dt: number, t: number) {
    const { width: w, height: h } = this
    for (const p of this.particles) {
      p.presence = p.dying ? p.presence - dt * 0.8 : Math.min(1, p.presence + dt * (p.kind === 'leaf' ? 2 : 0.5))
      switch (p.kind) {
        case 'firefly': {
          // Wander: steer by a slow, per-particle wobble; drift upward a little.
          p.angle += Math.sin(t * 0.6 + p.seed) * 1.6 * dt
          p.vx += Math.cos(p.angle) * 14 * dt
          p.vy += (Math.sin(p.angle) * 14 - 2) * dt
          if (pointer.active) {
            const dx = p.x - pointer.x
            const dy = p.y - pointer.y
            const distance = Math.hypot(dx, dy)
            if (distance < 160 && distance > 0.1) {
              const push = (1 - distance / 160) ** 2 * 520 * dt
              p.vx += (dx / distance) * push
              p.vy += (dy / distance) * push
            }
          }
          p.vx *= 1 - 0.9 * dt
          p.vy *= 1 - 0.9 * dt
          break
        }
        case 'leaf':
          p.angle += p.spin * dt
          p.vx = Math.sin(t * 0.9 + p.seed) * 28 + 10
          break
        case 'mote':
          p.vy += Math.sin(t * 0.7 + p.seed) * 3 * dt
          break
        case 'spark':
          p.age += dt
          p.vx *= 1 - 1.8 * dt
          p.vy = p.vy * (1 - 1.8 * dt) + 22 * dt
          break
      }
      p.x += p.vx * dt
      p.y += p.vy * dt

      // Wrap the ambient kinds around the edges.
      if (p.kind === 'rain' || p.kind === 'leaf') {
        if (p.y > h + 40) Object.assign(p, this.spawn(p.kind), { presence: p.presence, dying: p.dying, y: -40 })
      } else if (p.kind !== 'spark') {
        if (p.x < -30) p.x = w + 30
        if (p.x > w + 30) p.x = -30
        if (p.y < -30) p.y = h + 30
        if (p.y > h + 30) p.y = -30
      }
    }
    this.particles = this.particles.filter((p) => (p.dying ? p.presence > 0 : p.age < p.ttl))
  }

  private draw(t: number) {
    const { ctx } = this
    ctx.clearRect(0, 0, this.width, this.height)

    ctx.globalCompositeOperation = 'source-over'
    ctx.lineCap = 'round'
    for (const p of this.particles) {
      if (p.kind === 'rain') {
        ctx.globalAlpha = 0.28 * p.presence
        ctx.strokeStyle = '#cfe0ff'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * (p.size / p.vy), p.y - p.size)
        ctx.stroke()
      } else if (p.kind === 'leaf') {
        this.drawLeaf(p)
      }
    }

    ctx.globalCompositeOperation = 'lighter'
    for (const p of this.particles) {
      if (p.kind === 'firefly') {
        const blink = 0.5 + 0.5 * Math.sin(t * (0.8 + (p.seed % 1)) + p.seed)
        ctx.globalAlpha = p.presence * (0.18 + 0.82 * blink * blink)
        const size = p.size * (0.85 + 0.3 * blink)
        ctx.drawImage(this.sprites.firefly, p.x - size, p.y - size, size * 2, size * 2)
      } else if (p.kind === 'mote') {
        ctx.globalAlpha = p.presence * (0.35 + 0.25 * Math.sin(t + p.seed))
        ctx.drawImage(this.sprites.mote, p.x - p.size, p.y - p.size, p.size * 2, p.size * 2)
      } else if (p.kind === 'spark') {
        const fade = 1 - p.age / p.ttl
        ctx.globalAlpha = fade * fade
        const size = p.size * (0.6 + fade * 0.6)
        const sprite = p.color === 2 ? this.sprites.navi : this.sprites.spark
        ctx.drawImage(sprite, p.x - size, p.y - size, size * 2, size * 2)
      }
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  private drawLeaf(p: Particle) {
    const { ctx } = this
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.angle)
    // Tumbling: squash across the leaf as it flips.
    ctx.scale(Math.cos(p.angle * 1.7 + p.seed) * 0.8 + 0.2, 1)
    ctx.globalAlpha = 0.9 * p.presence
    ctx.fillStyle = LEAF_COLORS[p.color]
    const s = p.size
    ctx.beginPath()
    ctx.moveTo(0, -s)
    ctx.quadraticCurveTo(s * 0.75, -s * 0.2, 0, s)
    ctx.quadraticCurveTo(-s * 0.75, -s * 0.2, 0, -s)
    ctx.fill()
    ctx.restore()
  }
}
