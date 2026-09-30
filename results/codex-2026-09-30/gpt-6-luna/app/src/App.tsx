import { useEffect, useState } from 'react'
import './App.css'

const RELEASE_AT = Date.parse('2026-11-05T00:00:00-05:00')
const overriddenNow = new URLSearchParams(window.location.search).get('now')
const parsedNow = overriddenNow ? Date.parse(overriddenNow) : Number.NaN
const initialNow = Number.isFinite(parsedNow) ? parsedNow : Date.now()

function getRemaining(now: number) {
  const seconds = Math.max(0, Math.floor((RELEASE_AT - now) / 1000))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return {
    days,
    hours,
    minutes,
    seconds: remainingSeconds,
    duration: `P${days}DT${hours}H${minutes}M${remainingSeconds}S`,
    finished: seconds === 0,
  }
}

function App() {
  const [now, setNow] = useState(initialNow)
  const [copied, setCopied] = useState(false)
  const remaining = getRemaining(now)

  useEffect(() => {
    const startedAt = Date.now()
    const timer = window.setInterval(() => setNow(initialNow + Date.now() - startedAt), 1000)
    return () => window.clearInterval(timer)
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const units = [
    { label: 'Days', value: remaining.days },
    { label: 'Hours', value: remaining.hours },
    { label: 'Minutes', value: remaining.minutes },
    { label: 'Seconds', value: remaining.seconds },
  ]

  return (
    <main className="event" data-finished={remaining.finished}>
      <div className="backdrop" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Ocarina of Time countdown home">
          <span className="brand-mark">◇</span>
          <span>HYRULE<span className="brand-divider"> / </span>TIME</span>
        </a>
        <span className="top-note"><span className="live-dot" /> THE WAIT IS ALMOST OVER</span>
      </header>

      <section className="content" id="home" aria-label="Release countdown">
        <p className="eyebrow"><span className="rule" /> A LEGEND RETURNS <span className="rule" /></p>
        <img className="game-logo" src="/art/ocarina-logo.png" alt="The Legend of Zelda: Ocarina of Time" />
        <p className="edition">REMASTERED FOR <span>NINTENDO SWITCH 2</span></p>
        <div className="release-line"><span className="release-star">✳</span> THE GATES OF HYRULE OPEN <span className="release-star">✳</span></div>

        {remaining.finished ? (
          <div className="arrived" role="status">
            <span className="arrived-kicker">THE WAIT IS OVER</span>
            <h1>Your legend begins now.</h1>
            <p>November 5, 2026 · Available now</p>
          </div>
        ) : (
          <div className="clock" aria-label={`${remaining.days} days, ${remaining.hours} hours, ${remaining.minutes} minutes, ${remaining.seconds} seconds remaining`}>
            {units.map(({ label, value }) => (
              <div className="unit" key={label}>
                <span className="digits" aria-hidden="true">{String(value).padStart(2, '0')}</span>
                <span className="unit-label">{label}</span>
              </div>
            ))}
          </div>
        )}
        <time className="sr-only" dateTime={remaining.finished ? 'PT0S' : remaining.duration} />

        <div className="release-date"><span className="date-gem">◆</span> NOVEMBER 5, 2026 <span className="date-divider">·</span> MIDNIGHT ET</div>
        <button className="share-button" type="button" onClick={copyLink}>
          <span className="share-icon" aria-hidden="true">↗</span>
          {copied ? 'LINK COPIED' : 'SHARE THE COUNTDOWN'}
        </button>
      </section>

      <footer className="footer">
        <span className="footer-left">TIME IS A CIRCLE. THE LEGEND IS FOREVER.</span>
        <span className="footer-center"><span className="triad">△<i>△</i></span> HYRULE STANDARD TIME</span>
        <span className="footer-right">EST. BEFORE THE FIRST LIGHT</span>
      </footer>
    </main>
  )
}

export default App
