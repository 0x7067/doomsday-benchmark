import { GAME_TITLE, PLATFORM } from '../../config/launch'
import { describeDuration, toIsoDuration } from '../../lib/time/duration'

/**
 * The page's one and only `<time>` element: the machine-readable remaining
 * duration, updated every tick, reading `PT0S` from the moment on.
 *
 * It is visually hidden because the visible clock animates glyphs in and out
 * (so its text is briefly doubled); this gives screen readers and scripts a
 * clean value instead. It is not a live region, so it doesn't chatter every
 * second. Don't add other `<time>` elements to the page.
 */
export function RemainingTime({ seconds }: { seconds: number }) {
  return (
    <p className="sr-only">
      {seconds > 0 ? `${GAME_TITLE} launches on ${PLATFORM} in ` : `${GAME_TITLE} is out now on ${PLATFORM}. Time remaining: `}
      <time dateTime={toIsoDuration(seconds)}>{describeDuration(seconds)}</time>
    </p>
  )
}
