/**
 * A tiny Web Audio ocarina. No samples: every sound is synthesised, so the
 * page stays offline and weighs nothing extra. The AudioContext is created
 * lazily on the first user gesture, as browsers require.
 */

type Voice = { at: number; freq: number; dur: number; gain?: number }

const SECRET_JINGLE: readonly Voice[] = [
  // The "you solved a puzzle" chime: G4 F#4 D#4 A3 G#3 E4 G#4 C5.
  { at: 0.0, freq: 392.0, dur: 0.14 },
  { at: 0.14, freq: 369.99, dur: 0.14 },
  { at: 0.28, freq: 311.13, dur: 0.14 },
  { at: 0.42, freq: 220.0, dur: 0.14 },
  { at: 0.56, freq: 207.65, dur: 0.14 },
  { at: 0.7, freq: 329.63, dur: 0.14 },
  { at: 0.84, freq: 415.3, dur: 0.14 },
  { at: 0.98, freq: 523.25, dur: 0.7 },
]

/** A rising arpeggio for the moment the clock reaches zero. */
const FANFARE: readonly Voice[] = [
  { at: 0.0, freq: 293.66, dur: 0.22 },
  { at: 0.2, freq: 440.0, dur: 0.22 },
  { at: 0.4, freq: 587.33, dur: 0.22 },
  { at: 0.6, freq: 739.99, dur: 0.22 },
  { at: 0.8, freq: 880.0, dur: 1.6 },
  { at: 0.8, freq: 587.33, dur: 1.6, gain: 0.5 },
  { at: 0.8, freq: 440.0, dur: 1.6, gain: 0.4 },
]

export class Ocarina {
  private ctx: BaseAudioContext | null = null
  private master: GainNode | null = null
  private noise: AudioBuffer | null = null
  muted = false

  /** Must be called from inside a user gesture at least once. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx instanceof AudioContext && this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    if (typeof AudioContext === 'undefined') return
    this.attach(new AudioContext())
  }

  /**
   * Builds the output graph on `ctx`. `unlock` uses a live AudioContext; tests
   * pass an OfflineAudioContext to render and analyse the real output.
   */
  attach(ctx: BaseAudioContext): void {
    const master = ctx.createGain()
    master.gain.value = 0.5
    // A short feedback delay gives the "temple" reverb the ocarina is known for.
    const delay = ctx.createDelay()
    delay.delayTime.value = 0.23
    const feedback = ctx.createGain()
    feedback.gain.value = 0.28
    const wet = ctx.createGain()
    wet.gain.value = 0.35
    master.connect(ctx.destination)
    master.connect(delay)
    delay.connect(feedback).connect(delay)
    delay.connect(wet).connect(ctx.destination)

    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    this.ctx = ctx
    this.master = master
    this.noise = noise
  }

  /** True once audio has been unlocked by a gesture; used to gate ambient cues. */
  get ready(): boolean {
    return this.ctx !== null && this.ctx.state === 'running'
  }

  /** One breathy ocarina note. */
  note(freq: number, dur = 0.55, gain = 1, when = 0): void {
    const ctx = this.ctx
    if (!ctx || !this.master || this.muted) return
    const t = ctx.currentTime + when
    const end = t + dur

    const env = ctx.createGain()
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(0.32 * gain, t + 0.035)
    env.gain.setTargetAtTime(0.24 * gain, t + 0.05, 0.12)
    env.gain.setTargetAtTime(0, end, 0.09)
    env.connect(this.master)

    const body = ctx.createOscillator()
    body.type = 'sine'
    body.frequency.value = freq
    const overtone = ctx.createOscillator()
    overtone.type = 'triangle'
    overtone.frequency.value = freq * 2
    const overtoneGain = ctx.createGain()
    overtoneGain.gain.value = 0.06

    // Delayed vibrato, the way a player leans into a held note.
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 5.2
    const depth = ctx.createGain()
    depth.gain.setValueAtTime(0, t)
    depth.gain.linearRampToValueAtTime(freq * 0.006, t + Math.min(0.35, dur))
    lfo.connect(depth)
    depth.connect(body.frequency)
    depth.connect(overtone.frequency)

    body.connect(env)
    overtone.connect(overtoneGain).connect(env)

    // A breath of band-passed noise at the attack.
    if (this.noise) {
      const breath = ctx.createBufferSource()
      breath.buffer = this.noise
      const band = ctx.createBiquadFilter()
      band.type = 'bandpass'
      band.frequency.value = freq * 3
      band.Q.value = 1.2
      const breathGain = ctx.createGain()
      breathGain.gain.setValueAtTime(0.05 * gain, t)
      breathGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
      breath.connect(band).connect(breathGain).connect(this.master)
      breath.start(t)
      breath.stop(t + 0.2)
    }

    const stopAt = end + 0.5
    for (const osc of [body, overtone, lfo]) {
      osc.start(t)
      osc.stop(stopAt)
    }
  }

  /** A soft wooden tick for the final ten seconds. */
  tick(accent = false): void {
    const ctx = this.ctx
    if (!ctx || !this.master || this.muted) return
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(accent ? 1320 : 880, t)
    osc.frequency.exponentialRampToValueAtTime(accent ? 660 : 440, t + 0.08)
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.18, t)
    env.gain.exponentialRampToValueAtTime(0.0001, t + 0.12)
    osc.connect(env).connect(this.master)
    osc.start(t)
    osc.stop(t + 0.15)
  }

  secret(): void {
    this.sequence(SECRET_JINGLE, 0.6)
  }

  fanfare(): void {
    this.sequence(FANFARE, 0.8)
  }

  private sequence(voices: readonly Voice[], gain: number): void {
    for (const v of voices) this.note(v.freq, v.dur, (v.gain ?? 1) * gain, v.at)
  }
}

/** One instrument for the whole page. */
export const ocarina = new Ocarina()
