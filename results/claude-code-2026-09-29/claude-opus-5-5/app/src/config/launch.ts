/**
 * The one fact this whole page exists for.
 *
 * Midnight Eastern on November 5, 2026. US daylight saving time ends on
 * November 1 that year, so Eastern is on standard time (UTC−05:00) here.
 */
export const LAUNCH_ISO = '2026-11-05T00:00:00-05:00'
export const LAUNCH_AT = Date.parse(LAUNCH_ISO)

export const GAME_TITLE = 'The Legend of Zelda: Ocarina of Time'
export const PLATFORM = 'Nintendo Switch 2'

/** UTC offset of Eastern Time at the launch instant, in minutes (as `Date#getTimezoneOffset` reports it). */
export const LAUNCH_ET_OFFSET_MINUTES = 300
