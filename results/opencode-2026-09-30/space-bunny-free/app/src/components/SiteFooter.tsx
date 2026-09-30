import { EnginePanel } from './EnginePanel.tsx'
import styles from './SiteFooter.module.css'

export function SiteFooter() {
  return (
    <footer className={`shell ${styles.footer}`}>
      <div className={styles.colophon}>
        <p className={styles.mark}>The Legend of Zelda: Ocarina of Time</p>
        <p className={styles.line}>
          A countdown to the remake on Nintendo Switch 2. Front-end only: React, Vite and TypeScript, no
          backend, no network calls after the first paint. Fonts, images and every note of the Ocarina of Time
          are served from this bundle.
        </p>
        <p className={styles.legal}>
          An unofficial fan project. Not affiliated with or endorsed by Nintendo. The Legend of Zelda and
          Ocarina of Time are trademarks of Nintendo.
        </p>
      </div>

      <EnginePanel />

      <p className={styles.baseline}>
        <span>T-minus the remake</span>
        <a href="#top">Back to the clock</a>
      </p>
    </footer>
  )
}
