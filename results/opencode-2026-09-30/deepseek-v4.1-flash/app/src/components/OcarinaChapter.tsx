import forest from '../assets/art/forest.avif'
import { useParallax, useReveal } from '../hooks/useScrollFx'
import styles from './Chapter.module.css'
import { Ocarina } from './Ocarina'

type OcarinaChapterProps = {
  reduced: boolean
  soundOn: boolean
  onEnableSound: () => void
}

export function OcarinaChapter({ reduced, soundOn, onEnableSound }: OcarinaChapterProps) {
  const sectionRef = useReveal<HTMLElement>(reduced)
  const artRef = useParallax<HTMLDivElement>(28, reduced)

  return (
    <section className={styles.interlude} id="ocarina" ref={sectionRef}>
      <div className={styles.art} ref={artRef} aria-hidden="true">
        <img src={forest} alt="" loading="lazy" decoding="async" />
      </div>
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.columns}>
        <div className={styles.copy}>
          <p className="kicker" data-reveal>
            One instrument &middot; Five notes
          </p>
          <h2 className={styles.title} data-reveal>
            Play the <em>Song of Time</em>.
          </h2>
          <p className={styles.lede} data-reveal>
            Every melody you remember is still in there, waiting for the right hands. The ocarina is
            listening — press the notes and hear Hyrule answer.
          </p>
          <p className={styles.aside} data-reveal>
            <span className="diamond" aria-hidden="true" />
            Sound is synthesised in your browser. Nothing is streamed, nothing is stored.
          </p>
        </div>

        <div className={styles.instrument} data-reveal>
          <Ocarina soundOn={soundOn} onEnableSound={onEnableSound} />
        </div>
      </div>
    </section>
  )
}
