import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.mark}>
          <span className={styles.diamond} aria-hidden="true" />
          <span>The Legend of Zelda: Ocarina of Time</span>
          <span className={styles.diamond} aria-hidden="true" />
        </div>
        <p className={styles.meta}>Nintendo Switch 2 &middot; November 5, 2026 &middot; midnight Eastern</p>

        <p className={styles.tip}>
          Time travel: add <code>?now=2026-11-04T23:59:50-05:00</code> to the address to preview any
          moment.
        </p>

        <p className={styles.legal}>
          A fan-made countdown, built for the love of the game. Not affiliated with, endorsed by or
          sponsored by Nintendo. The Legend of Zelda and Ocarina of Time are trademarks of Nintendo.
        </p>
      </div>
    </footer>
  )
}
