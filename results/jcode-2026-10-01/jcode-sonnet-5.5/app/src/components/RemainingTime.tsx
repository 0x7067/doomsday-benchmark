import { splitSeconds, toIsoDuration } from '../lib/countdown'

/**
 * The page's single `<time>` element. Visually hidden: the designed digits are
 * aria-hidden, so assistive tech reads this once, as a sentence.
 */
export function RemainingTime({ remaining }: { remaining: number }) {
  const { days, hours, minutes, seconds } = splitSeconds(remaining)
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`
  const spoken =
    remaining === 0
      ? 'The Door of Time is open.'
      : `${plural(days, 'day')}, ${plural(hours, 'hour')}, ${plural(minutes, 'minute')} and ${plural(seconds, 'second')} remaining`
  return (
    <time className="sr-only" dateTime={toIsoDuration(remaining)}>
      {spoken}
    </time>
  )
}
