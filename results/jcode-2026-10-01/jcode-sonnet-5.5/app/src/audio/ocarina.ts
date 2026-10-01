import { NOTE_HZ } from '../data/songs'
import type { Button, Song } from '../data/songs'

type Ctx = AudioContext

/**
 * A small WebAudio synth that sounds like a clay ocarina: a near-pure sine with a
 * whisper of second harmonic, delayed vibrato, a soft breathy attack and a short
 * generated-room reverb. No audio files, so it works offline and weighs nothing.
 */
export class OcarinaAudio {
  private ctx: Ctx | null = null
  private master: GainNode | null = null
  private wet: GainNode | null = null
  private enabled = true
  private playbackToken = 0

  setEnabled(on: boolean) {
    this.enabled = on
    if (!on) this.playbackToken++
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(on ? 0.9 : 0, this.ctx.currentTime, 0.05)
    }
  }

  /** True once a user gesture has unlocked audio. Ambient sounds only play when this holds. */
  get unlocked(): boolean {
    return this.enabled && this.ctx?.state === 'running'
  }

  private ensure(): Ctx | null {
    if (!this.enabled) return null
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.wet = this.ctx.createGain()
      this.wet.gain.value = 0.34
      const convolver = this.ctx.createConvolver()
      convolver.buffer = makeImpulse(this.ctx, 2.2)
      this.wet.connect(convolver)
      convolver.connect(this.master)
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  playNote(button: Button, seconds = 0.55) {
    const ctx = this.ensure()
    if (!ctx || !this.master || !this.wet) return
    const t0 = ctx.currentTime
    const f = NOTE_HZ[button]

    const body = ctx.createOscillator()
    body.type = 'sine'
    body.frequency.value = f
    const overtone = ctx.createOscillator()
    overtone.type = 'sine'
    overtone.frequency.value = f * 2
    const overtoneGain = ctx.createGain()
    overtoneGain.gain.value = 0.07

    const vibrato = ctx.createOscillator()
    vibrato.frequency.value = 5.4
    const vibratoDepth = ctx.createGain()
    vibratoDepth.gain.setValueAtTime(0, t0)
    vibratoDepth.gain.linearRampToValueAtTime(f * 0.006, t0 + seconds * 0.8)
    vibrato.connect(vibratoDepth)
    vibratoDepth.connect(body.frequency)
    vibratoDepth.connect(overtone.frequency)

    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 2600

    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(0.32, t0 + 0.05)
    env.gain.setTargetAtTime(0.24, t0 + 0.08, 0.1)
    env.gain.setTargetAtTime(0.0001, t0 + seconds, 0.09)

    body.connect(tone)
    overtone.connect(overtoneGain)
    overtoneGain.connect(tone)
    tone.connect(env)
    env.connect(this.master)
    env.connect(this.wet)

    const end = t0 + seconds + 0.6
    for (const osc of [body, overtone, vibrato]) {
      osc.start(t0)
      osc.stop(end)
    }
  }

  /** Plays a whole song. Resolves when done or interrupted. */
  async playSong(song: Song, onNote?: (note: Button, index: number) => void, beat = 0.42) {
    const token = ++this.playbackToken
    for (let i = 0; i < song.notes.length; i++) {
      const note = song.notes[i]
      if (!note || token !== this.playbackToken) return
      this.playNote(note, beat * 1.15)
      onNote?.(note, i)
      await new Promise((r) => setTimeout(r, beat * 1000))
    }
  }

  /** A single low drum beat for the final seconds. */
  thump(strength = 1) {
    if (!this.unlocked) return
    const ctx = this.ensure()
    if (!ctx || !this.master) return
    const t0 = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(110, t0)
    osc.frequency.exponentialRampToValueAtTime(42, t0 + 0.18)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, t0)
    env.gain.exponentialRampToValueAtTime(0.5 * strength, t0 + 0.01)
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.35)
    osc.connect(env)
    env.connect(this.master)
    osc.start(t0)
    osc.stop(t0 + 0.4)
  }

  /** Soft fairy chime, used for Navi. */
  chime() {
    this.playNote('up', 0.25)
  }
}

function makeImpulse(ctx: Ctx, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2)
    }
  }
  return buffer
}
