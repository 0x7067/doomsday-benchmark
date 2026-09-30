import { useEffect, useRef, useState } from 'react'
import heroArt from '../assets/art/hero-epona.avif'
import logo from '../assets/art/logo-ocarina-of-time.png'
import { downloadIcs, shareCountdown } from '../lib/calendar'
import { localReleaseLabel, type Countdown as CountdownValue } from '../lib/time'
import { Countdown } from './Countdown'
import { Embers } from './Embers'
import { CalendarPlusIcon, ChevronIcon, ShareIcon, SpeakerIcon } from './Icons'
import { Navi } from './Navi'
import styles from './Hero.module.css'

const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

type HeroProps = {
  countdown: CountdownValue
  reduced: boolean
  soundOn: boolean
  onToggleSound: () => void
  onEnableSound: () => void
}

export function Hero({ countdown, reduced, soundOn, onToggleSound, onEnableSound }: HeroProps) {
  const heroRef = useRef<HTMLElement>(null)
  const [note, setNote] = useState<string | null>(null)
  const noteTimer = useRef<number | undefined>(undefined)

  // Fades the hero content and drifts the art as the visitor scrolls into the page.
  useEffect(() => {
    const hero = heroRef.current
    if (!hero || reduced) return
    let frame = 0
    const update = () => {
      frame = 0
      const progress = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight))
      hero.style.setProperty('--scroll-out', progress.toFixed(3))
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [reduced])

  useEffect(() => () => window.clearTimeout(noteTimer.current), [])

  const announce = (message: string) => {
    setNote(message)
    window.clearTimeout(noteTimer.current)
    noteTimer.current = window.setTimeout(() => setNote(null), 2600)
  }

  const handleCalendar = () => {
    downloadIcs()
    announce('Added — the release is in your calendar')
  }

  const handleShare = async () => {
    const outcome = await shareCountdown()
    if (outcome === 'copied') announce('Countdown link copied')
    if (outcome === 'failed') announce('Copy the address from your browser')
  }

  const localLabel = localReleaseLabel(TIME_ZONE)

  return (
    <header className={styles.hero} ref={heroRef}>
      <div className={styles.art} aria-hidden="true">
        <img src={heroArt} alt="" fetchPriority="high" decoding="async" />
      </div>
      <div className={styles.scrim} aria-hidden="true" />
      <Embers className={styles.embers} reduced={reduced} />
      <div className={styles.frame} aria-hidden="true" />

      <div className={styles.bar}>
        <p className={styles.lockup}>
          <span className={styles.lockupMark}>Nintendo Switch 2</span>
          <span className={styles.lockupLine} aria-hidden="true" />
        </p>
        <button
          type="button"
          className={styles.sound}
          onClick={onToggleSound}
          aria-pressed={soundOn}
          title={soundOn ? 'Mute the page' : 'Enable sound'}
        >
          <SpeakerIcon muted={!soundOn} />
          <span className={styles.soundLabel}>{soundOn ? 'Sound on' : 'Sound off'}</span>
        </button>
      </div>

      <div className={styles.body}>
        <img
          className={styles.logo}
          src={logo}
          width={640}
          height={478}
          alt="The Legend of Zelda: Ocarina of Time"
        />

        <p className={styles.date}>
          <span className={styles.dateRule} aria-hidden="true" />
          <span>November 5, 2026</span>
          <span className={styles.dateDivider} aria-hidden="true">
            &middot;
          </span>
          <span>Midnight ET</span>
          <span className={styles.dateRuleEnd} aria-hidden="true" />
        </p>

        <Countdown countdown={countdown} />

        {localLabel && <p className={styles.local}>In your time zone: {localLabel}</p>}

        <div className={styles.actions}>
          <button type="button" className="btn btn--primary" onClick={handleCalendar}>
            <CalendarPlusIcon />
            {countdown.released ? 'Save the date' : 'Add to calendar'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={handleShare}>
            <ShareIcon />
            {countdown.released ? 'Share the news' : 'Share'}
          </button>
        </div>

        <p className={styles.note} role="status" aria-live="polite">
          {note}
        </p>
      </div>

      <a className={styles.cue} href="#hyrule" aria-label="Discover Hyrule">
        <span>Discover Hyrule</span>
        <ChevronIcon />
      </a>

      <Navi
        boundsRef={heroRef}
        reduced={reduced}
        soundOn={soundOn}
        days={countdown.days}
        released={countdown.released}
        onEnableSound={onEnableSound}
      />
    </header>
  )
}
