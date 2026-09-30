import { Reveal } from './Reveal.tsx'
import deku1920 from '../assets/img/deku-1920.avif'
import deku1280 from '../assets/img/deku-1280.avif'
import deku800 from '../assets/img/deku-800.avif'
import { placeholder } from '../lib/placeholders.ts'
import styles from './DekuBand.module.css'

/**
 * The first full-bleed band. One image, one idea: the Deku Tree's bargain is
 * the bargain this clock is making, and it is the same bargain.
 */
export function DekuBand() {
  return (
    <section className={styles.band} aria-labelledby="deku-heading">
      <div className={styles.media} aria-hidden="true" style={{ backgroundImage: placeholder('deku') }}>
        <picture>
          <source media="(max-width: 700px)" srcSet={deku800} type="image/avif" />
          <source media="(max-width: 1200px)" srcSet={deku1280} type="image/avif" />
          <source srcSet={deku1920} type="image/avif" />
          <img className={styles.image} src={deku1920} alt="" loading="lazy" decoding="async" />
        </picture>
        <div className={styles.scrim} />
      </div>

      <div className={`shell ${styles.inner}`}>
        <Reveal>
          <p className="eyebrow">I &nbsp;·&nbsp; The Great Deku Tree</p>
        </Reveal>
        <Reveal delay={90}>
          <h2 id="deku-heading" className={`display ${styles.heading}`}>
            It gave him a year, and no more.
          </h2>
        </Reveal>
        <Reveal delay={180}>
          <p className={styles.body}>
            The Deku Tree offered the Hero of Time exactly what it had left to give. This clock offers the same
            bargain, in days, hours, minutes and seconds — and it is not being generous either.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
