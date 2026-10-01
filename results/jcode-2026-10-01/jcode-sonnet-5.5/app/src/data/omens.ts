import type { Phase } from '../lib/countdown'

/** One ominous line per stage of the countdown, in the voice of a dungeon sign. */
const OMENS: Record<Phase, readonly string[]> = {
  far: [
    'The Door of Time stands sealed.',
    'The Master Sword sleeps in its pedestal.',
    'Seven years is a long time to wait. Weeks are not.',
  ],
  week: [
    'The Temple of Time stirs beneath the stones.',
    'Navi has begun to whisper. Listen.',
    'The Sages feel the hour drawing near.',
  ],
  day: [
    'The final day. Hyrule Castle Town lights its lanterns.',
    'Epona is saddled and restless.',
    'Ganondorf watches the sky from his tower.',
  ],
  hour: [
    'The hour is upon you. Take up the ocarina.',
    'Fireflies gather at the forest edge.',
    'The sun and the moon wait on the same horizon.',
  ],
  minute: ['Hey! Listen!', 'The sealed door begins to glow.', 'Hold your breath.'],
  final: ['Hey! Listen!'],
  zero: ['The Door of Time is open.'],
}

/** Stable choice within a phase that rotates every 20 seconds. */
export function omenFor(phase: Phase, remaining: number): string {
  const lines = OMENS[phase]
  return lines[Math.floor(remaining / 20) % lines.length] ?? ''
}
