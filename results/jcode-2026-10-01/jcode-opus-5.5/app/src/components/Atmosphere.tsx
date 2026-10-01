import { memo, useEffect, useRef } from 'react'

interface Props {
  /** "r, g, b" tint for the floating motes. */
  tint: string
  rain: boolean
  night: boolean
  /** Bursts of golden light for the launch moment. */
  celebrate: boolean
  reducedMotion: boolean
}

interface Mote {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  phase: number
  speed: number
}

interface Drop {
  x: number
  y: number
  len: number
  v: number
}

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

const rand = (a: number, b: number) => a + Math.random() * (b - a)

/**
 * Everything alive in the air, drawn on one canvas in one animation loop:
 * drifting forest motes, rain from the Song of Storms, golden sparks at the
 * launch moment, and Navi, a fairy who drifts after the pointer.
 *
 * Props are read through a ref so changing them never restarts the loop.
 */
export const Atmosphere = memo(function Atmosphere(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const live = useRef(props)
  useEffect(() => {
    live.current = props
  })

  useEffect(() => {
    const el = canvas.current
    const ctx = el?.getContext('2d')
    if (!el || !ctx) return

    let w = 0
    let h = 0
    let dpr = 1
    let motes: Mote[] = []
    const drops: Drop[] = []
    const sparks: Spark[] = []
    let raf = 0
    let last = performance.now()

    // Navi: a spring toward the pointer, idling in a figure-eight when ignored.
    const navi = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, idleSince: 0 }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = el.clientWidth
      h = el.clientHeight
      el.width = Math.round(w * dpr)
      el.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.round(Math.min(70, (w * h) / 22000))
      motes = Array.from({ length: count }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        r: rand(0.8, 2.6),
        vx: rand(-6, 6),
        vy: rand(-14, -3),
        phase: rand(0, Math.PI * 2),
        speed: rand(0.6, 1.6),
      }))
      if (!navi.x) {
        // Start at her idle home (see the Navi block in `frame`).
        navi.x = navi.tx = w < 600 ? w * 0.84 : w * 0.74
        navi.y = navi.ty = w < 600 ? h * 0.1 : h * 0.32
      }
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    const onPointer = (e: PointerEvent) => {
      navi.tx = e.clientX + 26
      navi.ty = e.clientY - 22
      navi.idleSince = performance.now()
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('pointerdown', onPointer, { passive: true })

    const glow = (x: number, y: number, r: number, rgb: string, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `rgba(${rgb}, ${a})`)
      g.addColorStop(0.35, `rgba(${rgb}, ${a * 0.35})`)
      g.addColorStop(1, `rgba(${rgb}, 0)`)
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      const { tint, rain, night, celebrate, reducedMotion } = live.current
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'

      // Motes rise slowly and twinkle; brighter at night, like fireflies.
      for (const m of motes) {
        if (!reducedMotion) {
          m.phase += dt * m.speed
          m.x += (m.vx + Math.sin(m.phase) * 8) * dt
          m.y += m.vy * dt
          if (m.y < -10) {
            m.y = h + 10
            m.x = rand(0, w)
          }
          if (m.x < -10) m.x = w + 10
          if (m.x > w + 10) m.x = -10
        }
        const twinkle = 0.45 + 0.55 * Math.sin(m.phase * 2.3) ** 2
        glow(m.x, m.y, m.r * (night ? 7 : 5), tint, (night ? 0.75 : 0.45) * twinkle)
      }

      // Rain: spawn while raining, let the last drops finish when it stops.
      if (rain && !reducedMotion) {
        const want = Math.round((w * h) / 4500)
        for (let i = drops.length; i < want; i++) {
          drops.push({ x: rand(-h * 0.25, w), y: rand(-h, 0), len: rand(12, 26), v: rand(900, 1300) })
        }
      }
      if (drops.length) {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.35)'
        ctx.lineWidth = 1
        ctx.beginPath()
        for (let i = drops.length - 1; i >= 0; i--) {
          const d = drops[i]
          d.y += d.v * dt
          d.x += d.v * 0.18 * dt
          ctx.moveTo(d.x, d.y)
          ctx.lineTo(d.x - d.len * 0.18, d.y - d.len)
          if (d.y > h + 30) {
            if (rain) {
              d.y = rand(-60, 0)
              d.x = rand(-h * 0.25, w)
            } else drops.splice(i, 1)
          }
        }
        ctx.stroke()
        ctx.globalCompositeOperation = 'lighter'
      }

      // Launch sparks fountain up from the bottom edge.
      if (celebrate && !reducedMotion && sparks.length < 260) {
        for (let i = 0; i < 6; i++) {
          sparks.push({ x: rand(0, w), y: h + 10, vx: rand(-40, 40), vy: rand(-520, -260), life: 1 })
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.vy += 260 * dt
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.life -= dt * 0.45
        if (s.life <= 0) sparks.splice(i, 1)
        else glow(s.x, s.y, 9, '255, 214, 120', s.life * 0.9)
      }

      // Navi. When ignored she hovers off to the side: right of the logo on
      // wide screens, up by the top bar on phones where the centre is full.
      const idle = t - navi.idleSince > 2600
      const narrow = w < 600
      const homeX = narrow ? w * 0.84 : w * 0.74
      const homeY = narrow ? h * 0.1 : h * 0.32
      const ax = idle ? homeX + Math.sin(t / 1300) * w * 0.05 : navi.tx
      const ay = idle ? homeY + Math.sin(t / 650) * h * 0.025 : navi.ty
      if (reducedMotion) {
        navi.x = ax
        navi.y = ay
      } else {
        navi.vx += (ax - navi.x) * 9 * dt
        navi.vy += (ay - navi.y) * 9 * dt
        navi.vx *= 1 - 3.2 * dt
        navi.vy *= 1 - 3.2 * dt
        navi.x += navi.vx * dt
        navi.y += navi.vy * dt
      }
      const bob = reducedMotion ? 0 : Math.sin(t / 180) * 2.5
      const pulse = 0.85 + 0.15 * Math.sin(t / 240)
      glow(navi.x, navi.y + bob, 46 * pulse, '150, 200, 255', 0.5)
      glow(navi.x, navi.y + bob, 14, '235, 245, 255', 1)
      // Wings: two pairs of soft ellipses that flutter.
      const flap = reducedMotion ? 0.7 : 0.55 + 0.45 * Math.abs(Math.sin(t / 45))
      ctx.fillStyle = 'rgba(220, 235, 255, 0.55)'
      for (const side of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(navi.x + side * 9, navi.y + bob - 6, 9 * flap, 4, side * -0.6, 0, Math.PI * 2)
        ctx.ellipse(navi.x + side * 7, navi.y + bob + 4, 6 * flap, 3, side * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [])

  return <canvas ref={canvas} className="atmosphere" aria-hidden="true" />
})
