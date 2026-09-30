import { useMemo, type CSSProperties } from 'react'
import { pseudoRandom } from '../lib/random'
import styles from './ReleaseBurst.module.css'

const SPARKS = 72
const PALETTE = ['#f8e7b4', '#e3bd6c', '#ffb27a', '#fff6d8', '#c8ecff']

/** One-shot celebration when the countdown crosses zero. */
export function ReleaseBurst() {
  const sparks = useMemo(
    () =>
      Array.from({ length: SPARKS }, (_, index) => {
        const rand = (offset: number) => pseudoRandom(index * 7 + offset)
        const angle = (index / SPARKS) * Math.PI * 2 + rand(1) * 0.5
        const distance = 26 + rand(2) * 46
        return {
          id: index,
          dx: `${(Math.cos(angle) * distance).toFixed(2)}vmin`,
          dy: `${(Math.sin(angle) * distance * 0.86).toFixed(2)}vmin`,
          delay: `${(rand(3) * 0.35).toFixed(2)}s`,
          duration: `${(1.5 + rand(4) * 1.6).toFixed(2)}s`,
          size: `${(2 + rand(5) * 5).toFixed(1)}px`,
          color: PALETTE[index % PALETTE.length],
        }
      }),
    [],
  )

  return (
    <div className={styles.burst} aria-hidden="true">
      <span className={styles.flash} />
      {[0, 1, 2].map((ring) => (
        <span key={ring} className={styles.ring} style={{ animationDelay: `${ring * 0.16}s` }} />
      ))}
      {sparks.map((spark) => (
        <span
          key={spark.id}
          className={styles.spark}
          style={
            {
              '--dx': spark.dx,
              '--dy': spark.dy,
              '--size': spark.size,
              '--spark': spark.color,
              animationDelay: spark.delay,
              animationDuration: spark.duration,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
