/** Milliseconds since the epoch, like `Date.now`. */
export type Now = () => number

/**
 * Reads `?now=<ISO 8601>` from a query string.
 *
 * Returns the instant in epoch milliseconds, or `null` when the parameter is
 * absent or unparseable (the page then simply runs on real time).
 */
export function parseNowParam(search: string): number | null {
  const raw = new URLSearchParams(search).get('now')?.trim()
  if (!raw) return null
  // Query strings decode "+" as a space, so a hand-typed "…T09:00:00+02:00"
  // arrives as "…T09:00:00 02:00". Put the sign back before parsing.
  const normalized = raw.replace(/ (\d{2}(?::?\d{2})?)$/, '+$1')
  const ms = Date.parse(normalized)
  return Number.isNaN(ms) ? null : ms
}

/**
 * A clock that behaves as if the page loaded at `startAt`, then keeps ticking
 * at real speed. Without `startAt` it is just the real clock.
 */
export function createClock(startAt: number | null, realNow: Now = Date.now): Now {
  if (startAt === null) return realNow
  const offset = startAt - realNow()
  return () => realNow() + offset
}
