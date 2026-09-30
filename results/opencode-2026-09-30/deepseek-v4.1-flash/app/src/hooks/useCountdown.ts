import { useEffect, useRef, useState } from 'react'
import { countdownAt, parseNowParam, type Countdown } from '../lib/time'

type CountdownState = {
  countdown: Countdown
  /** True for one render pass when the clock crosses zero while mounted. */
  justReleased: boolean
}

/**
 * A clock that can be told to start anywhere.
 *
 * On mount it captures a real/virtual pair: real wall-clock milliseconds and
 * the instant the page should pretend it is (the `?now=` override, or real
 * time). Every tick re-derives the virtual now from real elapsed time, so the
 * countdown stays accurate even when the tab is throttled in the background.
 */
export function useCountdown(): CountdownState {
  const [origin] = useState(() => {
    const real = Date.now()
    return { real, virtual: parseNowParam(window.location.search) ?? real }
  })

  const [countdown, setCountdown] = useState<Countdown>(() => countdownAt(origin.virtual))
  const [justReleased, setJustReleased] = useState(false)
  const wasReleased = useRef(countdown.released)

  useEffect(() => {
    const tick = () => {
      const virtualNow = origin.virtual + (Date.now() - origin.real)
      setCountdown((previous) => {
        const next = countdownAt(virtualNow)
        return next.totalSeconds === previous.totalSeconds ? previous : next
      })
    }

    const timer = window.setInterval(tick, 200)
    const onVisible = () => {
      if (!document.hidden) tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [origin])

  useEffect(() => {
    if (countdown.released && !wasReleased.current) setJustReleased(true)
    wasReleased.current = countdown.released
  }, [countdown.released])

  useEffect(() => {
    if (!justReleased) return
    const timer = window.setTimeout(() => setJustReleased(false), 6000)
    return () => window.clearTimeout(timer)
  }, [justReleased])

  return { countdown, justReleased }
}
