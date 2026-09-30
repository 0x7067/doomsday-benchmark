import { useCallback, useEffect, useReducer, useRef } from 'react'
import { Logo } from './components/Logo'
import { PLATFORM } from './config/launch'
import { AtmosphereCanvas, type AtmosphereHandle } from './features/atmosphere/AtmosphereCanvas'
import { Backdrop } from './features/backdrop/Backdrop'
import { Arrival } from './features/countdown/Arrival'
import { CalendarButton } from './features/countdown/CalendarButton'
import { Countdown } from './features/countdown/Countdown'
import { Finale, FINALE_SECONDS } from './features/countdown/Finale'
import { LaunchDetails } from './features/countdown/LaunchDetails'
import { RemainingTime } from './features/countdown/RemainingTime'
import { useArrival } from './features/countdown/useArrival'
import { Lightning, TimeWarp, Triforce } from './features/effects/Effects'
import { AreaCard } from './features/hud/AreaCard'
import { Places } from './features/hud/Places'
import { SoundToggle } from './features/hud/SoundToggle'
import { NoteGlyphDefs } from './features/ocarina/NoteGlyph'
import { OcarinaDock } from './features/ocarina/OcarinaDock'
import { initialWorld, worldReducer } from './features/world/world'
import { synth } from './lib/audio/synth'
import { useRoomyLayout } from './lib/layout'
import type { Song } from './lib/ocarina/songs'
import { trackPointer } from './lib/pointer'
import { SCENES } from './lib/scenes/scenes'
import type { CountdownStore } from './lib/time/countdown-store'
import { useRemainingSeconds } from './lib/time/useRemainingSeconds'
import { useTabTitle } from './lib/time/useTabTitle'
import './App.css'

/** The Song of Storms' rain lasts about as long as it does in the game. */
const STORM_MS = 26_000

interface AppProps {
  countdown: CountdownStore
}

export default function App({ countdown }: AppProps) {
  const seconds = useRemainingSeconds(countdown)
  const [world, dispatch] = useReducer(worldReducer, seconds === 0, initialWorld)
  const scene = SCENES[world.sceneId]
  const atmosphere = useRef<AtmosphereHandle>(null)
  const clock = useRef<HTMLDivElement>(null)
  const roomy = useRoomyLayout()

  useEffect(() => trackPointer(), [])
  useTabTitle(seconds)

  // The Door of Time opens: white-out, a shower of sparks, the secret jingle, and the Great Deku Tree.
  const celebrate = useCallback(() => {
    dispatch({ type: 'launch' })
    synth.shimmer(2.4)
    synth.secret(1.5)
    const rect = clock.current?.getBoundingClientRect()
    if (rect) atmosphere.current?.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 180, 1.8)
  }, [])
  const { arrived, witnessed } = useArrival(seconds, celebrate)

  const onSong = useCallback((song: Song, origin: DOMRect | undefined) => {
    dispatch({ type: 'song', song: song.id })
    if (song.id === 'song-of-time') synth.shimmer()
    if (origin) atmosphere.current?.burst(origin.left + origin.width / 2, origin.top + origin.height * 0.35, 70, 0.9)
  }, [])

  useEffect(() => {
    if (!world.storm) return
    const timer = window.setTimeout(() => dispatch({ type: 'storm-passed' }), STORM_MS)
    return () => window.clearTimeout(timer)
  }, [world.storm, world.storms])

  const places = <Places current={world.sceneId} onVisit={(sceneId) => dispatch({ type: 'visit', sceneId })} />

  return (
    <div className="stage">
      <NoteGlyphDefs />
      <Backdrop sceneId={world.sceneId} via={world.via} night={world.night} storm={world.storm} />
      <AtmosphereCanvas ref={atmosphere} mode={scene.atmosphere} night={world.night} rain={world.storm} />
      <Lightning active={world.storm} />
      <Triforce count={world.triforces} />
      <AreaCard scene={scene} />

      <header className="topbar">
        <p className="topbar__platform">{PLATFORM}</p>
        {roomy && places}
        <div className="topbar__actions">
          {!roomy && !arrived && <CalendarButton compact />}
          <SoundToggle />
        </div>
      </header>

      <main className="hero">
        <div className="hero__column">
          <Logo />
          <RemainingTime seconds={seconds} />
          <div className="hero__lower">
            <div className="hero__clock" ref={clock}>
              {arrived ? (
                <Arrival
                  live={witnessed}
                  onRelive={() => {
                    synth.unlock()
                    celebrate()
                  }}
                />
              ) : (
                <>
                  <p className="hero__eyebrow" aria-hidden="true">
                    The Hero of Time returns in
                  </p>
                  <Countdown seconds={seconds} />
                  {seconds <= FINALE_SECONDS && <Finale seconds={seconds} />}
                </>
              )}
            </div>
            {!arrived && <LaunchDetails withCalendar={roomy} />}
          </div>
        </div>
      </main>

      <div className="hud">
        <OcarinaDock onSong={onSong} hushed={seconds > 0 && seconds <= FINALE_SECONDS}>
          {!roomy && places}
        </OcarinaDock>
      </div>

      <TimeWarp count={world.warps} long={arrived} />
    </div>
  )
}
