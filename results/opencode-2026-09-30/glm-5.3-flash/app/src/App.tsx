import { useEffect, useRef, useState } from 'react'
import { Backdrop } from './components/Backdrop'
import { Countdown } from './components/Countdown'
import { Fireflies } from './components/Fireflies'
import { SimBadge } from './components/SimBadge'
import { parseSimulatedNow, remainingTo, TARGET_LABEL } from './lib/time'
import { useNow } from './lib/useNow'
import { usePointerParallax } from './lib/usePointerParallax'
import { usePrefersReducedMotion } from './lib/usePrefersReducedMotion'
import './app.css'

export default function App() {
  const [clock] = useState(() => parseSimulatedNow(window.location.search))
  const now = useNow(clock)
  const remaining = remainingTo(now)
  const released = remaining.released
  const reducedMotion = usePrefersReducedMotion()
  const sceneRef = usePointerParallax<HTMLDivElement>()

  // One-shot golden flash the moment the countdown crosses zero.
  const wasReleased = useRef(released)
  const [flashCount, setFlashCount] = useState(0)
  useEffect(() => {
    if (released && !wasReleased.current) setFlashCount((count) => count + 1)
    wasReleased.current = released
  }, [released])

  // Keep the tab title useful at a glance; minute precision keeps churn low.
  useEffect(() => {
    document.title = released
      ? 'Ocarina of Time — Out Now'
      : `${remaining.days}d ${remaining.hours}h ${remaining.minutes}m — Doomsday Clock`
  }, [released, remaining.days, remaining.hours, remaining.minutes])

  return (
    <div ref={sceneRef} className={released ? 'scene-root is-released' : 'scene-root'}>
      <Backdrop />
      {!reducedMotion && <Fireflies />}

      <main className="content">
        <p className="eyebrow rise" style={{ animationDelay: '0.05s' }}>
          {released ? <span className="hey-listen">Hey! Listen!</span> : 'Doomsday Clock'}
        </p>

        <img
          className="logo rise"
          src="/images/oot-logo.png"
          alt="The Legend of Zelda: Ocarina of Time"
          draggable={false}
          decoding="async"
          style={{ animationDelay: '0.16s' }}
        />

        <div className="rise" style={{ animationDelay: '0.3s' }}>
          <Countdown value={remaining} released={released} />
        </div>

        <p className="dateline rise" style={{ animationDelay: '0.44s' }}>
          <span className="rule" aria-hidden="true" />
          {TARGET_LABEL}
          <span className="rule" aria-hidden="true" />
        </p>

        <p className="release-note" style={{ animationDelay: '0.6s' }}>
          The legend has returned — playing now on Nintendo Switch&nbsp;2.
        </p>
      </main>

      <footer className="footer">
        A fan-made vigil &middot; Not affiliated with Nintendo or Marvel Studios
      </footer>

      <SimBadge value={clock?.value ?? null} />
      {flashCount > 0 && <div key={flashCount} className="flash" aria-hidden="true" />}
    </div>
  )
}
