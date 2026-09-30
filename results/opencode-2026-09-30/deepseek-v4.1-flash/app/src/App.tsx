import { useEffect } from 'react'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { HyruleChapter } from './components/HyruleChapter'
import { OcarinaChapter } from './components/OcarinaChapter'
import { ReleaseBurst } from './components/ReleaseBurst'
import { useCountdown } from './hooks/useCountdown'
import { useReducedMotion } from './hooks/useReducedMotion'
import { useSound } from './hooks/useSound'
import { playChime } from './lib/audio'
import { pad2 } from './lib/time'
import './styles/global.css'

export default function App() {
  const { countdown, justReleased } = useCountdown()
  const reduced = useReducedMotion()
  const sound = useSound()

  // The tab title ticks along with the clock.
  useEffect(() => {
    document.title = countdown.released
      ? 'Ocarina of Time — out now on Nintendo Switch 2'
      : `${countdown.days}d ${pad2(countdown.hours)}:${pad2(countdown.minutes)}:${pad2(countdown.seconds)} · Ocarina of Time`
  }, [countdown])

  useEffect(() => {
    if (justReleased) playChime([1046.5, 1318.51, 1567.98, 2093.0], 3.6)
  }, [justReleased])

  return (
    <>
      <Hero
        countdown={countdown}
        reduced={reduced}
        soundOn={sound.soundOn}
        onToggleSound={sound.toggle}
        onEnableSound={sound.enable}
      />
      <main>
        <HyruleChapter reduced={reduced} />
        <OcarinaChapter reduced={reduced} soundOn={sound.soundOn} onEnableSound={sound.enable} />
      </main>
      <Footer />
      {justReleased && <ReleaseBurst />}
      <div className="grain" aria-hidden="true" />
    </>
  )
}
