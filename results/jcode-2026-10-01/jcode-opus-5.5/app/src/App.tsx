import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { SCENES, logo } from './art'
import { Atmosphere } from './components/Atmosphere'
import { Backdrop } from './components/Backdrop'
import { Countdown } from './components/Countdown'
import { OcarinaPanel } from './components/OcarinaPanel'
import { Songbook } from './components/Songbook'
import { useClock } from './hooks/useClock'
import { useOcarina } from './hooks/useOcarina'
import { useReducedMotion } from './hooks/useReducedMotion'
import { ocarina } from './lib/audio'
import { downloadLaunchEvent } from './lib/calendar'
import { LAUNCH_MS, remainingUntil, toSpokenDuration } from './lib/countdown'
import { SONGS, type Song } from './lib/songs'
import { INITIAL_WORLD, worldFromSearch, worldReducer } from './lib/world'

const VISION_MS = 6500

/** "Thursday, November 5 at 2:00 AM" in the visitor's own zone. */
const localLaunch = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
}).format(LAUNCH_MS)

export default function App() {
  const now = useClock()
  const remaining = remainingUntil(now)
  const launched = remaining.totalSeconds === 0
  const reducedMotion = useReducedMotion()

  const [world, dispatch] = useReducer(worldReducer, INITIAL_WORLD, (initial) =>
    import.meta.env.DEV ? worldFromSearch(window.location.search) : initial,
  )
  const [songbookOpen, setSongbookOpen] = useState(
    () => import.meta.env.DEV && new URLSearchParams(window.location.search).has('songbook'),
  )
  const [muted, setMuted] = useState(false)

  const onSong = useCallback((song: Song) => dispatch({ type: 'song', song: song.id }), [])
  const oc = useOcarina(onSong, !songbookOpen)

  // Development aid for screenshots, which can't click: `?play=saria` performs
  // a song shortly after load, `?songbook` opens the song list. Both are behind
  // `import.meta.env.DEV`, so production builds drop them entirely.
  const devDemo = useRef(oc.demo)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const song = SONGS.find((s) => s.id === new URLSearchParams(window.location.search).get('play'))
    if (!song) return
    const t = window.setTimeout(() => devDemo.current(song), 400)
    return () => window.clearTimeout(t)
  }, [])

  // The Song of Time vision closes itself after a few seconds.
  useEffect(() => {
    if (!world.vision) return
    const t = window.setTimeout(() => dispatch({ type: 'endVision' }), VISION_MS)
    return () => window.clearTimeout(t)
  }, [world.vision])

  useEffect(() => {
    ocarina.muted = muted
  }, [muted])

  // Final-ten-seconds ticks and the launch fanfare. Only audible if the
  // visitor has already interacted (browsers block autoplay otherwise).
  const lastSecond = useRef(remaining.totalSeconds)
  useEffect(() => {
    const prev = lastSecond.current
    lastSecond.current = remaining.totalSeconds
    if (prev === remaining.totalSeconds || !ocarina.ready) return
    if (remaining.totalSeconds === 0 && prev > 0) ocarina.fanfare()
    else if (remaining.totalSeconds <= 10 && remaining.totalSeconds > 0) ocarina.tick(remaining.totalSeconds <= 3)
  }, [remaining.totalSeconds])

  // The tab title counts down too.
  useEffect(() => {
    document.title = launched
      ? 'Ocarina of Time is out now'
      : `${remaining.days}d ${String(remaining.hours).padStart(2, '0')}:${String(remaining.minutes).padStart(2, '0')}:${String(remaining.seconds).padStart(2, '0')} · Ocarina of Time`
  }, [launched, remaining.days, remaining.hours, remaining.minutes, remaining.seconds])

  const scene = SCENES[world.scene]
  const showLaunch = launched || world.vision
  const openSongbook = useCallback(() => setSongbookOpen(true), [])
  const closeSongbook = useCallback(() => setSongbookOpen(false), [])

  const atmosphere = useMemo(
    () => (
      <Atmosphere
        tint={world.night ? '170, 210, 255' : scene.mote}
        rain={world.rain}
        night={world.night}
        celebrate={showLaunch}
        reducedMotion={reducedMotion}
      />
    ),
    [world.night, world.rain, scene.mote, showLaunch, reducedMotion],
  )

  return (
    <div
      className="stage"
      data-scene={world.scene}
      data-night={world.night || undefined}
      data-rain={world.rain || undefined}
      data-launch={showLaunch || undefined}
      data-vision={world.vision || undefined}
    >
      <Backdrop scene={world.scene} />
      <div className="shade" aria-hidden="true" />
      {atmosphere}

      <header className="topbar">
        <p className="topbar__place" aria-live="polite">
          <span className="topbar__pin" aria-hidden="true" />
          {scene.name}
        </p>
        <button
          type="button"
          className="topbar__sound"
          aria-pressed={!muted}
          onClick={() => {
            ocarina.unlock()
            setMuted((m) => !m)
          }}
        >
          <SoundIcon on={!muted} />
          <span>{muted ? 'Sound off' : 'Sound on'}</span>
        </button>
      </header>

      <main className="hero">
        <h1 className="hero__logo">
          <img src={logo} alt="The Legend of Zelda: Ocarina of Time" width="617" height="460" />
        </h1>

        <div className="hero__clock" data-hidden={world.vision || undefined}>
          <p className="hero__eyebrow">{launched ? 'The wait is over' : 'Arrives on Nintendo Switch\u00a02 in'}</p>
          <Countdown remaining={remaining} />
        </div>

        {showLaunch && (
          <div className="launch" role={world.vision ? 'status' : undefined}>
            {world.vision && <p className="launch__eyebrow">A glimpse through the Door of Time</p>}
            <p className="launch__headline">The legend awakens</p>
            <p className="launch__sub">
              {world.vision ? `Available ${localLaunch}` : 'Available now on Nintendo Switch 2'}
            </p>
            {world.vision && (
              <button type="button" className="btn btn--ghost" onClick={() => dispatch({ type: 'endVision' })}>
                Return to the present
              </button>
            )}
          </div>
        )}

        {!launched && (
          <div className="hero__meta">
            <p className="hero__date">
              <span className="hero__when">
                <strong>November 5, 2026</strong>
                <span aria-hidden="true"> · </span>
                <span className="visually-hidden">, </span>
                Midnight Eastern
              </span>
              <span className="hero__local">{localLaunch} where you are</span>
            </p>
            <button type="button" className="btn" onClick={downloadLaunchEvent}>
              <CalendarIcon />
              Add to calendar
            </button>
          </div>
        )}
      </main>

      <aside className="dock">
        <OcarinaPanel
          staff={oc.staff}
          sounding={oc.sounding}
          recognised={oc.recognised}
          demoing={oc.demoing}
          onPlay={oc.play}
          onOpenSongbook={openSongbook}
        />
      </aside>

      <Songbook open={songbookOpen} onClose={closeSongbook} onPerform={oc.demo} />
      <p className="visually-hidden" aria-live="assertive">
        {launched ? 'Ocarina of Time is out now.' : remaining.totalSeconds <= 10 ? toSpokenDuration(remaining) : ''}
      </p>
    </div>
  )
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke="none" />
      {on ? (
        <>
          <path d="M16.5 8.5a5 5 0 0 1 0 7" />
          <path d="M19 6a8.5 8.5 0 0 1 0 12" />
        </>
      ) : (
        <path d="M17 9l5 6M22 9l-5 6" />
      )}
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  )
}
