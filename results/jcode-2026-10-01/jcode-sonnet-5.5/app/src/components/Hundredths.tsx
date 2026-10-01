import { useEffect, useState } from 'react'
import { getClock } from '../lib/clock'
import { RELEASE_MS, pad2 } from '../lib/countdown'

/** Hundredths of a second, driven by animation frames. Only mounted while time is slowed. */
export function Hundredths() {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const clock = getClock()
    let raf = 0
    const frame = () => {
      const left = Math.max(0, RELEASE_MS - clock.now())
      const sub = left % 1000
      setValue(left === 0 ? 0 : Math.floor(sub / 10))
      raf = requestAnimationFrame(frame)
    }
    frame()
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="hundredths" aria-hidden="true">
      .{pad2(value)}
    </div>
  )
}
