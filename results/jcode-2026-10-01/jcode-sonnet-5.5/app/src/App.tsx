import { useCallback, useEffect, useId, useReducer, useRef, useState } from 'react'
import { ocarinaAudio } from './audio'
import { Arrival } from './components/Arrival'
import { Backdrop } from './components/Backdrop'
import { Countdown } from './components/Countdown'
import { FinalCount } from './components/FinalCount'
import { Navi } from './components/Navi'
import { OcarinaPad } from './components/OcarinaPad'
import { Particles } from './components/Particles'
import { RemainingTime } from './components/RemainingTime'
import { SceneSwitcher } from './components/SceneSwitcher'
import { Songbook } from './components/Songbook'
import { Toast } from './components/Toast'
import logo from './assets/logo.webp'
import { omenFor } from './data/omens'
import { SONGS } from './data/songs'
import type { Song, SongId } from './data/songs'
import { useOcarina } from './hooks/useOcarina'
import { usePointerParallax } from './hooks/usePointerParallax'
import { useRemaining } from './hooks/useCountdown'
import { phaseFor, tensionFor } from './lib/countdown'
import { localReleaseLabel } from './lib/format'
import { stageFromSearch } from './state/initial'
import { stageReducer } from './state/stage'
import './App.css'

const SLOW_TIME_MS = 9000

export default function App() {
  const remaining = useRemaining()
  const phase = phaseFor(remaining)
  const tension = tensionFor(remaining)

  const [stage, dispatch] = useReducer(stageReducer, window.location.search, stageFromSearch)
  const [bookOpen, setBookOpen] = useState(() => new URLSearchParams(window.location.search).has('songbook'))
  const [muted, setMuted] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const nonce = useRef(0)
  const titleId = useId()

  usePointerParallax(rootRef)

  const onSong = useCallback((song: SongId) => {
    const id = ++nonce.current
    dispatch({ type: 'song', song, nonce: id })
    window.setTimeout(() => dispatch({ type: 'toast-cleared', nonce: id }), 4300)
    if (song === 'time') window.setTimeout(() => dispatch({ type: 'slow-time-ended' }), SLOW_TIME_MS)
  }, [dispatch])

  const ocarina = useOcarina({ onSong, enabled: !bookOpen })

  const { perform } = ocarina
  const onPlayForMe = useCallback(
    (song: Song) => {
      setBookOpen(false)
      void perform(song)
    },
    [perform, setBookOpen],
  )

  // The moment itself: fire the one-shot celebration only if we watched it arrive.
  const wasRunning = useRef(remaining > 0)
  const [arrivedLive, setArrivedLive] = useState(false)
  useEffect(() => {
    if (remaining === 0 && wasRunning.current) {
      wasRunning.current = false
      setArrivedLive(true)
      dispatch({ type: 'arrival' })
      void ocarinaAudio.playSong(SONGS[0] as Song, undefined, 0.5)
    }
  }, [remaining])

  const toggleSound = () => {
    setMuted((m) => {
      ocarinaAudio.setEnabled(m)
      return !m
    })
  }

  const arrived = phase === 'zero'
  const local = localReleaseLabel()

  return (
    <div
      ref={rootRef}
      className="app"
      data-phase={phase}
      data-day={stage.day}
      data-rain={stage.rain}
      style={{ '--tension': tension.toFixed(3) } as React.CSSProperties}
    >
      <Backdrop scene={stage.scene} day={stage.day} />
      <Particles rain={stage.rain} day={stage.day} burst={stage.burst} tension={tension} flash={stage.flash} />
      {phase === 'final' && <FinalCount remaining={remaining} />}
      <div className="pulse" key={stage.pulse} data-on={stage.pulse > 0} aria-hidden="true" />

      <main className="stage" aria-labelledby={titleId}>
        <RemainingTime remaining={remaining} />
        <Navi />

        {arrived ? (
          <section className="hero hero--arrived">
            <Arrival live={arrivedLive} />
            <Countdown remaining={0} slowTime={false} compact />
          </section>
        ) : (
          <section className="hero">
            <img className="hero__logo" src={logo} alt="" width={640} height={478} />
            <p className="hero__eyebrow">Coming to Nintendo Switch 2</p>
            <h1 id={titleId} className="hero__title">
              <span className="gold-text">The Door of Time opens in</span>
            </h1>
            <Countdown remaining={remaining} slowTime={stage.slowTime} />
            <p className="hero__date">
              <span>November 5, 2026</span>
              <i aria-hidden="true" />
              <span>12:00 AM Eastern</span>
            </p>
            {local && <p className="hero__local">That is {local} for you.</p>}
            <p className="hero__omen" key={`${phase}-${Math.floor(remaining / 20)}`}>
              {omenFor(phase, remaining)}
            </p>
          </section>
        )}

        <footer className="dock">
          <div className="dock__left">
            <SceneSwitcher scene={stage.scene} onSelect={(scene) => dispatch({ type: 'scene', scene })} />
          </div>
          <OcarinaPad trail={ocarina.trail} lit={ocarina.lit} onPress={ocarina.press} />
          <div className="dock__right">
            <button type="button" className="chip" onClick={() => setBookOpen(true)}>
              <span aria-hidden="true">♪</span> Songbook
            </button>
            <button type="button" className="chip" onClick={toggleSound} aria-pressed={!muted}>
              <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span> {muted ? 'Sound off' : 'Sound on'}
            </button>
          </div>
        </footer>
      </main>

      <Toast toast={stage.toast} />
      <Songbook
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        learned={stage.learned}
        performing={ocarina.performing}
        onPlay={onPlayForMe}
      />
    </div>
  )
}
