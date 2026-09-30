import { useEffect, useImperativeHandle, useRef, type Ref } from 'react'
import { usePrefersReducedMotion } from '../../lib/useMediaQuery'
import { AtmosphereEngine, type AtmosphereConfig } from './engine'
import './atmosphere.css'

export interface AtmosphereHandle {
  /** Sparks from a point in viewport CSS pixels. */
  burst(x: number, y: number, count?: number, spread?: number): void
}

interface AtmosphereCanvasProps extends AtmosphereConfig {
  ref?: Ref<AtmosphereHandle>
}

/** Mounts the particle engine; skipped entirely for people who prefer reduced motion. */
export function AtmosphereCanvas({ mode, night, rain, ref }: AtmosphereCanvasProps) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const engine = useRef<AtmosphereEngine | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion || !canvas.current) return
    const instance = new AtmosphereEngine(canvas.current)
    engine.current = instance
    instance.start()
    const onVisibility = () => (document.hidden ? instance.stop() : instance.start())
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      instance.destroy()
      engine.current = null
    }
  }, [reducedMotion])

  useEffect(() => {
    engine.current?.configure({ mode, night, rain })
  }, [mode, night, rain, reducedMotion])

  useImperativeHandle(ref, () => ({ burst: (...args) => engine.current?.burst(...args) }), [])

  if (reducedMotion) return null
  return <canvas ref={canvas} className="atmosphere" aria-hidden="true" />
}
