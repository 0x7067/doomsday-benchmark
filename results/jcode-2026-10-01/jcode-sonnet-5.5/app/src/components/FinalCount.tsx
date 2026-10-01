import { useEffect } from 'react'
import { ocarinaAudio } from '../audio'
import './FinalCount.css'

/** The last ten seconds: one enormous number, a ripple and a drum beat per second. */
export function FinalCount({ remaining }: { remaining: number }) {
  useEffect(() => {
    ocarinaAudio.thump(remaining <= 3 ? 1.3 : 1)
  }, [remaining])

  return (
    <div className="final" aria-hidden="true">
      <div className="final__ring" key={`r${remaining}`} />
      <div className="final__ring final__ring--late" key={`l${remaining}`} />
      <div className="final__num gold-text" key={remaining}>
        {remaining}
      </div>
    </div>
  )
}
