import { Countdown } from './Countdown.tsx'
import { DoomsdayDial } from './DoomsdayDial.tsx'
import { SceneTriptych } from './SceneTriptych.tsx'
import forest1920 from '../assets/img/forest-1920.webp'
import forest1280 from '../assets/img/forest-1280.webp'
import forest800 from '../assets/img/forest-800.webp'
import logo from '../assets/img/logo.webp'
import { placeholder } from '../lib/placeholders.ts'
import { toSpokenDuration } from '../lib/time.ts'
import type { Remaining } from '../lib/time.ts'
import styles from './Hero.module.css'

export function Hero({ remaining }: { remaining: Remaining }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title" data-arrived={remaining.arrived}>
      <div className={styles.backdrop} aria-hidden="true" style={{ backgroundImage: placeholder('forest') }}>
        <picture>
          <source media="(max-width: 640px)" srcSet={forest800} />
          <source media="(max-width: 1100px)" srcSet={forest1280} />
          <img className={styles.forest} src={forest1920} alt="" fetchPriority="high" decoding="async" />
        </picture>
        <div className={styles.shafts} />
        <div className={styles.vignette} />
        <div className={styles.seat} />
        <div className={styles.grain} />
      </div>

      <div className={styles.chrome} aria-hidden="true">
        <span className={styles.chromeMark}>A&nbsp;doomsday&nbsp;clock</span>
        <span className={styles.chromeRule} />
        <span className={styles.chromeMark}>05&nbsp;·&nbsp;11&nbsp;·&nbsp;2026</span>
      </div>

      <div className={styles.stage}>
        <div className={styles.lockup}>
          <img
            className={styles.logo}
            src={logo}
            width="618"
            height="460"
            alt="The Legend of Zelda: Ocarina of Time"
            fetchPriority="high"
            decoding="async"
          />
          <h1 id="hero-title" className="visually-hidden">
            The Legend of Zelda: Ocarina of Time — a countdown to the remake on Nintendo Switch 2
          </h1>
          <p className={styles.sub}>The remake</p>
        </div>

        <p className={styles.kicker}>
          {remaining.arrived ? 'The clock has reached midnight' : 'Until the Master Sword is drawn'}
        </p>

        <DoomsdayDial arrived={remaining.arrived} />

        <Countdown
          remaining={remaining}
          label={
            remaining.arrived
              ? 'The moment has arrived. Zero days, zero hours, zero minutes and zero seconds remain.'
              : `${toSpokenDuration(remaining)} remaining.`
          }
        />

        <p className={styles.moment}>
          <span>00:00 Eastern</span>
          <span className={styles.dot} aria-hidden="true" />
          <span>Nintendo Switch 2</span>
        </p>
      </div>

      <SceneTriptych />
    </section>
  )
}
