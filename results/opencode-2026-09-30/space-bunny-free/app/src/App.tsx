import { useEffect, useState } from 'react'
import { ClockProvider } from './components/ClockProvider.tsx'
import { useRemaining, useUrgency } from './lib/useClock.ts'
import { DekuBand } from './components/DekuBand.tsx'
import { Gallery } from './components/Gallery.tsx'
import { Hero } from './components/Hero.tsx'
import { MomentSection } from './components/MomentSection.tsx'
import { NaviMotes } from './components/NaviMotes.tsx'
import { OcarinaPanel } from './components/OcarinaPanel.tsx'
import { SiteFooter } from './components/SiteFooter.tsx'
import { MS_PER_HOUR, MS_PER_MINUTE, MS_PER_SECOND } from './lib/time.ts'
import type { Remaining } from './lib/time.ts'
import styles from './App.module.css'

/**
 * The moments worth saying out loud.
 *
 * A screen reader watching a value change once a second is unusable, so the
 * page stays silent and says only this. Levels count *down* as the moment
 * approaches; the announcement fires when the level changes, and only then.
 */
const ARRIVED = -1
const SILENT = 3

const MILESTONES: ReadonlyArray<{ level: number; text: string }> = [
  { level: 0, text: 'Ten seconds to the moment.' },
  { level: 1, text: 'One minute until The Legend of Zelda: Ocarina of Time.' },
  {
    level: 2,
    text: 'One hour until The Legend of Zelda: Ocarina of Time arrives on Nintendo Switch 2.',
  },
]

const ARRIVAL_TEXT =
  'Midnight. The gate is open. The Legend of Zelda: Ocarina of Time is out on Nintendo Switch 2.'

function levelFor(remaining: Remaining): number {
  if (remaining.arrived) return ARRIVED
  if (remaining.totalMs > MS_PER_HOUR) return SILENT
  if (remaining.totalMs > MS_PER_MINUTE) return 2
  if (remaining.totalMs > 10 * MS_PER_SECOND) return 1
  return 0
}

function textFor(level: number): string {
  if (level === ARRIVED) return ARRIVAL_TEXT
  return MILESTONES.find((milestone) => milestone.level === level)?.text ?? ''
}

function useMilestone(remaining: Remaining): string {
  const [spoken, setSpoken] = useState<{ level: number; text: string }>(() => {
    const level = levelFor(remaining)
    return { level, text: level === SILENT ? '' : textFor(level) }
  })

  // Adjusting state during render, rather than in an effect: this is derived
  // from props, and React re-runs the component immediately without a paint.
  const level = levelFor(remaining)
  if (level !== spoken.level) {
    setSpoken({ level, text: level === SILENT ? '' : textFor(level) })
  }

  return spoken.text
}

function Page() {
  const remaining = useRemaining()
  const urgency = useUrgency(remaining)
  const announcement = useMilestone(remaining)
  const [doorOpen, setDoorOpen] = useState(false)

  // One custom property drives every palette shift on the page.
  useEffect(() => {
    document.documentElement.style.setProperty('--urgency', urgency.toFixed(4))
  }, [urgency])

  useEffect(() => {
    document.documentElement.dataset.door = doorOpen ? 'open' : 'shut'
  }, [doorOpen])

  useEffect(() => {
    document.title = remaining.arrived
      ? 'Out now — The Legend of Zelda: Ocarina of Time'
      : `T-minus ${remaining.days}d ${remaining.hours}h — Ocarina of Time countdown`
  }, [remaining])

  return (
    <div className={styles.page} data-arrived={remaining.arrived} data-door={doorOpen ? 'open' : 'shut'}>
      <a className="skip-link" href="#scenes">
        Skip the countdown
      </a>

      <NaviMotes />
      <div className={styles.ambient} aria-hidden="true" />

      <main id="top">
        <Hero remaining={remaining} />
        <DekuBand />
        <Gallery />
        <OcarinaPanel doorOpen={doorOpen} onDoorChange={setDoorOpen} />
        <MomentSection remaining={remaining} />
      </main>

      <SiteFooter />

      <p className="visually-hidden" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

export function App() {
  return (
    <ClockProvider>
      <Page />
    </ClockProvider>
  )
}
