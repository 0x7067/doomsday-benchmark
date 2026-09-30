import '@fontsource-variable/cinzel/wght.css'
import '@fontsource-variable/eb-garamond/wght.css'
import '@fontsource-variable/eb-garamond/wght-italic.css'
import './styles/tokens.css'
import './styles/base.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { LAUNCH_AT } from './config/launch'
import { createClock, parseNowParam } from './lib/time/clock'
import { createCountdownStore } from './lib/time/countdown-store'

// `?now=<ISO 8601>` starts the clock at that instant; it then runs in real time.
const startAt = parseNowParam(window.location.search)
if (startAt === null && new URLSearchParams(window.location.search).has('now')) {
  console.warn('Ignoring ?now: expected an ISO 8601 timestamp such as 2026-11-04T23:59:50-05:00.')
}
const now = createClock(startAt)
const countdown = createCountdownStore(LAUNCH_AT, now)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App countdown={countdown} />
  </StrictMode>,
)
