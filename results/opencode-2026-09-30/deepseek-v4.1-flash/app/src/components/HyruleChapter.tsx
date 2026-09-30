import type { CSSProperties } from 'react'
import { useParallax, useReveal } from '../hooks/useScrollFx'
import dekuTree from '../assets/art/deku-tree.avif'
import styles from './Chapter.module.css'

const FEATURES = [
  {
    numeral: 'I',
    title: 'A world reborn',
    body: 'Hyrule Field at dawn, the Lost Woods in bloom, Death Mountain on the horizon — every landmark rebuilt for a new generation of hardware.',
  },
  {
    numeral: 'II',
    title: 'The songs remain',
    body: 'Five notes on an ocarina still open the Door of Time. Every melody is exactly as you remember it, waiting for your hands.',
  },
  {
    numeral: 'III',
    title: 'The legend endures',
    body: 'Dungeons, puzzles and a story that has never aged a day. Faithful to the original in every way that matters.',
  },
]

export function HyruleChapter({ reduced }: { reduced: boolean }) {
  const sectionRef = useReveal<HTMLElement>(reduced)
  const artRef = useParallax<HTMLDivElement>(32, reduced)

  return (
    <section className={styles.chapter} id="hyrule" ref={sectionRef}>
      <div className={styles.art} ref={artRef} aria-hidden="true">
        <img src={dekuTree} alt="" loading="lazy" decoding="async" />
      </div>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.inner}>
        <p className="kicker" data-reveal>
          Return to Hyrule
        </p>
        <h2 className={styles.title} data-reveal>
          Every legend begins <em>with a single step</em>.
        </h2>
        <p className={styles.lede} data-reveal>
          Before the sword, before the princess, there was a boy standing at the edge of a forest,
          listening. On November 5, that forest opens again.
        </p>

        <ul className={styles.features}>
          {FEATURES.map((feature, index) => (
            <li
              key={feature.title}
              className={styles.feature}
              data-reveal
              style={{ '--reveal-delay': `${index * 130}ms` } as CSSProperties}
            >
              <span className={styles.numeral} aria-hidden="true">
                {feature.numeral}
              </span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureBody}>{feature.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
