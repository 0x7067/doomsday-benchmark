import { useCallback, useEffect, useRef, useState } from 'react'
import { Reveal } from './Reveal.tsx'
import { toSpokenDuration } from '../lib/time.ts'
import type { Remaining } from '../lib/time.ts'
import styles from './MomentSection.module.css'

/** Where the moment falls, in the reader's own words. */
const LOCAL_READING = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
})

const GATE = Date.parse('2026-11-05T00:00:00-05:00')

interface Props {
  remaining: Remaining
}

export function MomentSection({ remaining }: Props) {
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')
  const resetTimer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    },
    [],
  )

  const share = useCallback(async () => {
    const line = remaining.arrived
      ? 'The Legend of Zelda: Ocarina of Time is out now on Nintendo Switch 2.'
      : `${capitalise(toSpokenDuration(remaining))} until The Legend of Zelda: Ocarina of Time on Nintendo Switch 2.`
    const url = new URL(window.location.href)
    url.searchParams.delete('now')

    const payload = `${line}\n${url.toString()}`

    try {
      await navigator.clipboard.writeText(payload)
      setCopied('done')
    } catch {
      setCopied('failed')
    }

    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopied('idle'), 3200)
  }, [remaining])

  return (
    <section id="moment" className={`shell ${styles.section}`} aria-labelledby="moment-heading">
      <Reveal className={styles.intro}>
        <p className="eyebrow">IV &nbsp;·&nbsp; The moment</p>
        <h2 id="moment-heading" className={`display ${styles.heading}`}>
          The gate opens at midnight, exactly.
        </h2>
      </Reveal>

      <Reveal className={styles.plate} delay={100}>
        <dl className={styles.vitals}>
          <div className={styles.vital}>
            <dt className={styles.term}>Platform</dt>
            <dd className={styles.detail}>Nintendo Switch 2</dd>
          </div>
          <div className={styles.vital}>
            <dt className={styles.term}>Moment</dt>
            <dd className={styles.detail}>05 November 2026, 00:00 Eastern</dd>
          </div>
          <div className={styles.vital}>
            <dt className={styles.term}>Where you are</dt>
            <dd className={styles.detail}>{LOCAL_READING.format(GATE)}</dd>
          </div>
          <div className={styles.vital}>
            <dt className={styles.term}>Standing at</dt>
            <dd className={styles.detail} data-state={remaining.arrived ? 'open' : 'counting'}>
              {remaining.arrived
                ? 'Zero. The clock has stopped.'
                : `${capitalise(toSpokenDuration(remaining))} remaining.`}
            </dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <button type="button" className={styles.copy} onClick={share} data-state={copied}>
            {copied === 'done'
              ? 'Copied to clipboard'
              : copied === 'failed'
                ? 'Copy failed'
                : 'Copy the countdown'}
          </button>
          <p className={styles.zoneNote} aria-hidden="true">
            Midnight Eastern is 05:00 UTC — daylight saving is still in effect on 5 November.
          </p>
        </div>
      </Reveal>

      <Reveal className={styles.closing} delay={200}>
        <p>
          Link is already on the bridge. He has been there a while. The only thing missing is the rest of you,
          and a console.
        </p>
      </Reveal>
    </section>
  )
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
