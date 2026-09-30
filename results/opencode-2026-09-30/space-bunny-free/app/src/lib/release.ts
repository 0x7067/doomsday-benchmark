/**
 * The one true fact this whole site is built around.
 *
 * The Ocarina of Time remake unlocks at midnight Eastern on 5 November 2026.
 * Eastern observes daylight saving on that date, so the offset really is -05:00
 * and the wall-clock reading is unambiguous: 00:00:00 on the fifth.
 */
export const RELEASE_ISO = '2026-11-05T00:00:00-05:00'

/** Epoch milliseconds of the moment. */
export const RELEASE_MS = Date.parse(RELEASE_ISO)

/**
 * Every clock face on this page reads in the moment's own timezone, so the hands
 * always converge on twelve at the instant the gate opens — no matter where the
 * visitor happens to be sitting.
 */
export const RELEASE_TIME_ZONE = 'America/New_York'

export const MS_PER_SECOND = 1000
export const MS_PER_MINUTE = 60_000
export const MS_PER_HOUR = 3_600_000
export const MS_PER_DAY = 86_400_000
