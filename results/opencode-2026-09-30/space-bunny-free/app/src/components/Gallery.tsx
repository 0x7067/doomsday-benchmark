import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { Reveal } from './Reveal.tsx'
import { usePrefersReducedMotion } from '../lib/useClock.ts'
import { placeholder } from '../lib/placeholders.ts'
import poster900 from '../assets/img/poster-900.webp'
import poster560 from '../assets/img/poster-560.webp'
import deku1920 from '../assets/img/deku-1920.avif'
import deku1280 from '../assets/img/deku-1280.avif'
import deku800 from '../assets/img/deku-800.avif'
import epona1920 from '../assets/img/epona-1920.avif'
import epona1280 from '../assets/img/epona-1280.avif'
import epona800 from '../assets/img/epona-800.avif'
import styles from './Gallery.module.css'

/**
 * A slow parallax, written straight to CSS custom properties.
 *
 * One scroll listener, one rAF, two style writes. No React state — a gallery
 * that re-rendered on scroll would fight the countdown for the main thread.
 */
function useParallax() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (reduced || !node) return

    let frame = 0
    const write = () => {
      frame = 0
      const rect = node.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const raw = (rect.top + rect.height / 2 - viewport / 2) / (viewport / 2 + rect.height / 2)
      // Clamped: an element two screens away would otherwise shift its plate
      // clean out of the frame, and that is exactly what a full-page capture
      // or a deep link would do.
      const progress = Math.max(-1, Math.min(1, raw))
      node.style.setProperty('--parallax', progress.toFixed(4))
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(write)
    }

    write()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [reduced])

  return ref
}

/** How far each plate drifts against the scroll, in screen-widths of travel. */
const depth = (amount: number) => ({ '--depth': amount }) as CSSProperties

export function Gallery() {
  const gridRef = useParallax()

  return (
    <section id="scenes" className={`shell ${styles.section}`} aria-labelledby="scenes-heading">
      <Reveal className={styles.intro}>
        <p className="eyebrow">II &nbsp;·&nbsp; The world, rebuilt</p>
        <h2 id="scenes-heading" className={`display ${styles.heading}`}>
          The valley you remember, at a resolution you have not seen.
        </h2>
      </Reveal>

      <div className={styles.grid} ref={gridRef}>
        <Reveal as="figure" className={styles.poster} delay={60}>
          <div className={styles.plate} style={{ ...depth(0.06), backgroundImage: placeholder('poster') }}>
            <picture>
              <source media="(max-width: 620px)" srcSet={poster560} type="image/webp" />
              <img
                className={styles.image}
                src={poster900}
                alt="Link stands in the Kokiri Forest, lit from above, with Navi glowing beside his shoulder."
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className={styles.grain} aria-hidden="true" />
          </div>
          <figcaption className={styles.caption}>
            <span className={styles.place}>Kokiri Forest</span>
            <span className={styles.note}>
              Where it starts. Light comes down through the canopy and a fairy will not leave you alone.
            </span>
          </figcaption>
        </Reveal>

        <Reveal as="figure" className={styles.scene} delay={140}>
          <div className={styles.plate} style={{ ...depth(0.1), backgroundImage: placeholder('deku') }}>
            <picture>
              <source media="(max-width: 700px)" srcSet={deku800} type="image/avif" />
              <source media="(max-width: 1200px)" srcSet={deku1280} type="image/avif" />
              <source srcSet={deku1920} type="image/avif" />
              <img
                className={styles.image}
                src={deku1920}
                alt="Link stands before the Great Deku Tree, leaves drifting down around him."
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className={styles.grain} aria-hidden="true" />
          </div>
          <figcaption className={styles.caption}>
            <span className={styles.place}>The Great Deku Tree</span>
            <span className={styles.note}>
              The last guardian. It still has that face, and it is still holding on.
            </span>
          </figcaption>
        </Reveal>

        <Reveal as="figure" className={styles.scene} delay={220}>
          <div className={styles.plate} style={{ ...depth(0.14), backgroundImage: placeholder('epona') }}>
            <picture>
              <source media="(max-width: 700px)" srcSet={epona800} type="image/avif" />
              <source media="(max-width: 1200px)" srcSet={epona1280} type="image/avif" />
              <source srcSet={epona1920} type="image/avif" />
              <img
                className={styles.image}
                src={epona1920}
                alt="Link rides Epona across a field with Death Mountain on the horizon."
                loading="lazy"
                decoding="async"
              />
            </picture>
            <span className={styles.grain} aria-hidden="true" />
          </div>
          <figcaption className={styles.caption}>
            <span className={styles.place}>Death Mountain</span>
            <span className={styles.note}>
              The volcano wakes the moment the gate opens. It has always woken the moment the gate opens.
            </span>
          </figcaption>
        </Reveal>
      </div>
    </section>
  )
}
