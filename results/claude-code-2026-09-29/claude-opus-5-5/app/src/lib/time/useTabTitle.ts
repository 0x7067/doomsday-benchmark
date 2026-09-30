import { useEffect } from 'react'
import { splitSeconds } from './duration'

const BASE_TITLE = 'Ocarina of Time · Nintendo Switch 2'
const pad = (n: number) => String(n).padStart(2, '0')

/** Keeps the remaining time in the tab title, for everyone who leaves the page open. */
export function useTabTitle(seconds: number) {
  useEffect(() => {
    if (seconds === 0) {
      document.title = `Out now · ${BASE_TITLE}`
      return
    }
    const { days, hours, minutes, seconds: s } = splitSeconds(seconds)
    document.title = `${days}d ${pad(hours)}:${pad(minutes)}:${pad(s)} · ${BASE_TITLE}`
  }, [seconds])
}
