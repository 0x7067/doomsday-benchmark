import { useEffect, useRef, useState } from 'react'

/**
 * Tells "the page opened after launch" apart from "the visitor watched the
 * clock reach zero". `onWitness` runs once, in the latter case only.
 */
export function useArrival(seconds: number, onWitness: () => void): { arrived: boolean; witnessed: boolean } {
  const arrived = seconds === 0
  const [counting, setCounting] = useState(!arrived)
  const [witnessed, setWitnessed] = useState(false)
  if (counting && arrived) {
    setCounting(false)
    setWitnessed(true)
  }

  const callback = useRef(onWitness)
  useEffect(() => {
    callback.current = onWitness
  })
  useEffect(() => {
    if (witnessed) callback.current()
  }, [witnessed])

  return { arrived, witnessed }
}
