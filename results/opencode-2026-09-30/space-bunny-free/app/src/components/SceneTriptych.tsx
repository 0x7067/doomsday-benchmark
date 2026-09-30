import deku1280 from '../assets/img/deku-1280.avif'
import deku560 from '../assets/img/deku-560.webp'
import epona1280 from '../assets/img/epona-1280.avif'
import epona560 from '../assets/img/epona-560.webp'
import poster560 from '../assets/img/poster-560.webp'
import poster360 from '../assets/img/poster-360.webp'
import { placeholder } from '../lib/placeholders.ts'
import styles from './SceneTriptych.module.css'

interface Scene {
  id: string
  place: string
  href: string
  /** Served when the rail is at its narrowest, which is most of the time. */
  small: string
  smallType: string
  large: string
  largeType: string
  width: number
  height: number
  /** All frames are 16:9; only the crop within the source varies. */
  crop?: string
}

const SCENES: readonly Scene[] = [
  {
    id: 'deku',
    place: 'The Great Deku Tree',
    href: '#scenes',
    small: deku560,
    smallType: 'image/webp',
    large: deku1280,
    largeType: 'image/avif',
    width: 16,
    height: 9,
  },
  {
    id: 'epona',
    place: 'Death Mountain',
    href: '#scenes',
    small: epona560,
    smallType: 'image/webp',
    large: epona1280,
    largeType: 'image/avif',
    width: 16,
    height: 9,
  },
  {
    id: 'poster',
    place: 'Kokiri Forest',
    href: '#scenes',
    small: poster360,
    smallType: 'image/webp',
    large: poster560,
    largeType: 'image/webp',
    width: 16,
    height: 9,
    crop: 'poster',
  },
]

/**
 * The bottom rail of the hero. Three frames, hairline-ruled, each a doorway
 * into the gallery below — and a promise that there is more page under here.
 *
 * The frames are at most 230 CSS pixels wide, so they get their own small
 * encodes rather than the gallery's multi-kilobyte ones.
 */
export function SceneTriptych() {
  return (
    <nav className={styles.rail} aria-label="Scenes from the remake">
      <ul className={styles.list}>
        {SCENES.map((scene) => (
          <li key={scene.id} className={styles.cell}>
            <a className={styles.link} href={scene.href}>
              <span
                className={styles.frame}
                data-crop={scene.crop ?? 'wide'}
                style={{ backgroundImage: placeholder(scene.id as 'deku' | 'epona' | 'poster') }}
              >
                <picture>
                  <source media="(max-width: 34rem)" srcSet={scene.small} type={scene.smallType} />
                  <source srcSet={scene.large} type={scene.largeType} />
                  <img
                    className={styles.image}
                    src={scene.large}
                    width={scene.width * 60}
                    height={scene.height * 60}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                </picture>
                <span className={styles.sheen} aria-hidden="true" />
              </span>
              <span className={styles.caption}>{scene.place}</span>
            </a>
          </li>
        ))}
      </ul>
      <a className={styles.more} href="#scenes">
        <span>See more</span>
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
          <path
            d="M8 2v12M3.5 9.5 8 14l4.5-4.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </nav>
  )
}
