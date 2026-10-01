import { OfflineAudioContext } from 'node-web-audio-api'
import { describe, expect, it } from 'vitest'
import { Ocarina } from './audio'
import { NOTES } from './songs'

/**
 * Renders the synth through a real Web Audio implementation (the Rust
 * `node-web-audio-api`, not a mock) and checks the samples: right pitch, no
 * clipping, audible level, notes that end, and mute that is actually silent.
 */

const RATE = 44100

async function render(play: (o: Ocarina) => void, seconds = 2): Promise<Float32Array> {
  const ctx = new OfflineAudioContext(1, RATE * seconds, RATE)
  const o = new Ocarina()
  o.attach(ctx as unknown as BaseAudioContext)
  play(o)
  const buffer = await ctx.startRendering()
  return buffer.getChannelData(0)
}

const peak = (s: Float32Array, from = 0, to = s.length) => {
  let m = 0
  for (let i = from; i < to; i++) m = Math.max(m, Math.abs(s[i]))
  return m
}

const rms = (s: Float32Array, from: number, to: number) => {
  let sum = 0
  for (let i = from; i < to; i++) sum += s[i] * s[i]
  return Math.sqrt(sum / (to - from))
}

/** Fundamental via autocorrelation over a window, searched between 150 and 1200 Hz. */
function pitch(s: Float32Array, from: number, length: number): number {
  let best = 0
  let bestLag = 0
  for (let lag = Math.floor(RATE / 1200); lag <= Math.ceil(RATE / 150); lag++) {
    let c = 0
    for (let i = from; i < from + length; i++) c += s[i] * s[i + lag]
    if (c > best) {
      best = c
      bestLag = lag
    }
  }
  return RATE / bestLag
}

describe('ocarina synth (rendered)', () => {
  it.each(NOTES.map((n) => [n.id, n.frequency] as const))('%s sounds at %f Hz', async (_id, freq) => {
    const s = await render((o) => o.note(freq, 0.6))
    // Measure the sustain before the 0.23 s echo arrives, after the attack.
    const measured = pitch(s, Math.floor(0.06 * RATE), Math.floor(0.12 * RATE))
    // Within a quarter-tone (≈3%) of the target; vibrato is still near zero here.
    expect(Math.abs(measured - freq) / freq).toBeLessThan(0.03)
  })

  it('is audible but never clips, even for the full fanfare chord', async () => {
    const note = await render((o) => o.note(440, 0.6))
    expect(peak(note)).toBeGreaterThan(0.05)
    const fanfare = await render((o) => o.fanfare(), 4)
    expect(peak(fanfare)).toBeLessThan(1)
    const secret = await render((o) => o.secret(), 3)
    expect(peak(secret)).toBeLessThan(1)
  })

  it('a note decays to silence instead of droning', async () => {
    const s = await render((o) => o.note(440, 0.4), 3)
    const during = rms(s, Math.floor(0.1 * RATE), Math.floor(0.3 * RATE))
    const after = rms(s, Math.floor(2.5 * RATE), Math.floor(3 * RATE))
    expect(during).toBeGreaterThan(0.02)
    expect(after).toBeLessThan(during / 100)
  })

  it('the echo is quieter than the note it repeats', async () => {
    const s = await render((o) => o.note(440, 0.1), 1.5)
    const dry = peak(s, 0, Math.floor(0.2 * RATE))
    const firstEcho = peak(s, Math.floor(0.4 * RATE), Math.floor(0.6 * RATE))
    expect(firstEcho).toBeGreaterThan(0)
    expect(firstEcho).toBeLessThan(dry)
  })

  it('the final-seconds tick is short', async () => {
    const s = await render((o) => o.tick(true), 1)
    expect(peak(s, 0, Math.floor(0.05 * RATE))).toBeGreaterThan(0.02)
    // Dry tick is gone by 0.2 s; only its faint echo remains.
    expect(rms(s, Math.floor(0.6 * RATE), RATE)).toBeLessThan(0.005)
  })

  it('mute is silent', async () => {
    const s = await render((o) => {
      o.muted = true
      o.note(440)
      o.tick()
      o.secret()
      o.fanfare()
    })
    expect(peak(s)).toBe(0)
  })

  it('does nothing before a context is attached', () => {
    const o = new Ocarina()
    expect(() => o.note(440)).not.toThrow()
    expect(o.ready).toBe(false)
  })
})
