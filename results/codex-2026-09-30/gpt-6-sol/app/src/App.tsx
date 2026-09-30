import { useEffect, useState } from 'react'
import './App.css'

const RELEASE = Date.parse('2026-11-05T00:00:00-05:00')
const queryNow = new URLSearchParams(window.location.search).get('now')
const initialNow = queryNow && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(queryNow)
  ? Date.parse(queryNow)
  : NaN
const clockStart = Number.isFinite(initialNow) ? initialNow : Date.now()
const elapsedStart = performance.now()

const scenes = [
  { name: 'Hyrule Field', image: '/images/hyrule-field.avif', caption: 'Beyond the horizon, a new adventure awaits.' },
  { name: 'Kokiri Forest', image: '/images/deku-tree.avif', caption: 'Every legend begins somewhere.' },
]

function remainingSeconds() {
  return Math.max(0, Math.ceil((RELEASE - (clockStart + performance.now() - elapsedStart)) / 1000))
}

function parts(total: number) {
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

function duration(total: number) {
  if (total === 0) return 'PT0S'
  const { days, hours, minutes, seconds } = parts(total)
  return `P${days}DT${hours}H${minutes}M${seconds}S`
}

function App() {
  const [remaining, setRemaining] = useState(remainingSeconds)
  const [sceneIndex, setSceneIndex] = useState(0)
  const countdown = parts(remaining)
  const arrived = remaining === 0

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const update = () => {
      const next = remainingSeconds()
      setRemaining(next)
      if (next > 0) {
        const elapsed = clockStart + performance.now() - elapsedStart
        timer = setTimeout(update, Math.max(50, 1000 - (elapsed % 1000) + 10))
      }
    }
    update()
    return () => clearTimeout(timer)
  }, [])

  const scene = scenes[sceneIndex]

  return (
    <main className={`experience ${arrived ? 'has-arrived' : ''}`}>
      {scenes.map((item, index) => (
        <div key={item.name} className={`scene-image ${index === sceneIndex ? 'is-active' : ''}`} style={{ backgroundImage: `url('${item.image}')` }} aria-hidden="true" />
      ))}
      <div className="scene-shade" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      <div className="frame-corners" aria-hidden="true" />
      <div className="content">
        <header className="site-header">
          <div className="brand-lockup">
            <img src="/images/zelda-logo.png" alt="The Legend of Zelda: Ocarina of Time" />
            <span className="edition">Reimagined for Nintendo Switch 2</span>
          </div>
          <div className="header-right">
            <span className="diamond" aria-hidden="true" />
            <span>THE COUNTDOWN HAS BEGUN</span>
            <span className="header-rule" />
            <span className="header-date">11 · 05 · 26</span>
          </div>
        </header>
        <section className="hero" aria-labelledby="headline">
          <div className="hero-intro">
            <span className="eyebrow"><span className="eyebrow-line" /> A NEW ERA OF HYRULE <span className="eyebrow-line" /></span>
            <h1 id="headline">The legend<br /><em>returns.</em></h1>
            <p>{arrived ? 'The wait is over. Your journey begins now.' : 'The journey of a lifetime begins in'}</p>
          </div>
          <div className="clock-wrap">
            <div className="clock-topline"><span className="ornament">✦</span><span>{arrived ? 'THE ADVENTURE BEGINS' : 'UNTIL THE GATES OF HYRULE OPEN'}</span><span className="ornament">✦</span></div>
            <time dateTime={duration(remaining)} aria-label={arrived ? 'The countdown has ended' : `${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes, ${countdown.seconds} seconds remaining`}>
              {([['days', countdown.days], ['hours', countdown.hours], ['minutes', countdown.minutes], ['seconds', countdown.seconds]] as const).map(([label, value], index) => (
                <span className="clock-cell" key={label}>
                  {index > 0 && <span className="clock-separator" aria-hidden="true">:</span>}
                  <span className="clock-number">{String(value).padStart(label === 'days' ? 3 : 2, '0')}</span>
                  <span className="clock-label">{label}</span>
                </span>
              ))}
            </time>
            <div className="clock-bottomline"><span /> <span>TIME IS THE KEY TO EVERYTHING</span> <span /></div>
          </div>
        </section>
        <footer className="site-footer">
          <div className="release-info">
            <span className="footer-symbol" aria-hidden="true">✧</span>
            <div><span className="footer-label">THE WAIT ENDS</span><strong>November 5, 2026 <i>·</i> 12:00 AM ET</strong></div>
          </div>
          <div className="scene-control">
            <div className="scene-copy"><span className="footer-label">A GLIMPSE OF HYRULE</span><strong>{scene.name}</strong><small>{scene.caption}</small></div>
            <button type="button" onClick={() => setSceneIndex((index) => (index + 1) % scenes.length)} aria-label={`View ${scenes[(sceneIndex + 1) % scenes.length].name}`}><span aria-hidden="true">↗</span></button>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default App
