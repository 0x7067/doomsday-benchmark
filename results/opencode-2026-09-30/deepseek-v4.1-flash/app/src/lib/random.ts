/**
 * Deterministic pseudo-random source. Used for decorative particle layouts so
 * that renders are reproducible (and pure enough for React's rules).
 */
export function pseudoRandom(seed: number): number {
  let t = (seed + 0x6d2b79f5) | 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
