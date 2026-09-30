/**
 * Every sound on the page is synthesized with Web Audio, so there is nothing
 * to download and it all works offline.
 *
 * Browsers only allow audio after a user gesture, so the context is created
 * lazily by `unlock()` (call it from a pointer or key handler). Until then,
 * and while muted, every method is a silent no-op.
 */

export interface Voice {
  /** Release the note. Safe to call more than once. */
  stop(): void
}

const SILENT: Voice = { stop() {} }

/** Frequencies of the "you solved a puzzle" jingle: G F♯ D♯ A G♯ E G♯ C. */
const SECRET_JINGLE = [783.99, 739.99, 622.25, 440.0, 415.3, 659.25, 830.61, 1046.5]

type AudioContextConstructor = typeof AudioContext

function holdAt(param: AudioParam, time: number) {
  if (typeof param.cancelAndHoldAtTime === 'function') {
    param.cancelAndHoldAtTime(time)
  } else {
    param.cancelScheduledValues(time)
    param.setValueAtTime(param.value, time)
  }
}

class Synth {
  private ctx: AudioContext | null = null
  private bus: GainNode | null = null
  private noise: AudioBuffer | null = null
  private rain: { source: AudioBufferSourceNode; gain: GainNode } | null = null
  private muted = false

  /** True once audio has been unlocked by a gesture and isn't muted. */
  get audible(): boolean {
    return !this.muted && this.ctx?.state === 'running'
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (!this.ctx || !this.bus) return
    const t = this.ctx.currentTime
    holdAt(this.bus.gain, t)
    this.bus.gain.setTargetAtTime(muted ? 0 : 1, t, 0.05)
  }

  /** Create or resume the audio context. Must run inside a user gesture the first time. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume()
      return
    }
    const Ctor: AudioContextConstructor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext
    if (!Ctor) return
    const ctx = new Ctor()
    this.ctx = ctx

    // voices → bus → (dry + reverb) → compressor → speakers
    const bus = ctx.createGain()
    bus.gain.value = this.muted ? 0 : 1
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -14
    compressor.ratio.value = 3
    const reverb = ctx.createConvolver()
    reverb.buffer = impulseResponse(ctx, 2.6)
    const wet = ctx.createGain()
    wet.gain.value = 0.32
    bus.connect(compressor)
    bus.connect(reverb)
    reverb.connect(wet)
    wet.connect(compressor)
    compressor.connect(ctx.destination)
    this.bus = bus
  }

  private live(): { ctx: AudioContext; bus: GainNode } | null {
    if (!this.ctx || !this.bus || this.muted) return null
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return { ctx: this.ctx, bus: this.bus }
  }

  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noise) {
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
      this.noise = buffer
    }
    return this.noise
  }

  /**
   * An ocarina note: a sine with a touch of octave overtone, a breathy
   * chiff on the attack, a small scoop into pitch and vibrato that blooms
   * as the note is held. Sustains until `stop()`.
   */
  noteOn(frequency: number, level = 1): Voice {
    const live = this.live()
    if (!live) return SILENT
    const { ctx, bus } = live
    const t = ctx.currentTime

    const out = ctx.createGain()
    out.gain.setValueAtTime(0, t)
    out.gain.linearRampToValueAtTime(0.3 * level, t + 0.045)
    out.gain.setTargetAtTime(0.22 * level, t + 0.06, 0.18)
    out.connect(bus)

    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = Math.min(5200, frequency * 6)
    tone.Q.value = 0.3
    tone.connect(out)

    const oscillators = [1, 2].map((partial) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(frequency * partial * 0.975, t)
      osc.frequency.exponentialRampToValueAtTime(frequency * partial, t + 0.08)
      const gain = ctx.createGain()
      gain.gain.value = partial === 1 ? 1 : 0.09
      osc.connect(gain)
      gain.connect(tone)
      return osc
    })

    const lfo = ctx.createOscillator()
    lfo.frequency.value = 5.3
    for (const [i, osc] of oscillators.entries()) {
      const depth = ctx.createGain()
      depth.gain.setValueAtTime(0, t)
      depth.gain.linearRampToValueAtTime(frequency * (i + 1) * 0.0042, t + 0.5)
      lfo.connect(depth)
      depth.connect(osc.frequency)
    }

    const breath = ctx.createBufferSource()
    breath.buffer = this.noiseBuffer(ctx)
    breath.loop = true
    const breathBand = ctx.createBiquadFilter()
    breathBand.type = 'bandpass'
    breathBand.frequency.value = frequency * 2.2
    breathBand.Q.value = 1.4
    const breathGain = ctx.createGain()
    breathGain.gain.setValueAtTime(0, t)
    breathGain.gain.linearRampToValueAtTime(0.06 * level, t + 0.02)
    breathGain.gain.setTargetAtTime(0.01 * level, t + 0.03, 0.07)
    breath.connect(breathBand)
    breathBand.connect(breathGain)
    breathGain.connect(out)

    const sources: AudioScheduledSourceNode[] = [...oscillators, lfo, breath]
    for (const source of sources) source.start(t)

    let stopped = false
    return {
      stop() {
        if (stopped) return
        stopped = true
        // Very short taps still sound like a note.
        const at = Math.max(ctx.currentTime, t + 0.16)
        holdAt(out.gain, at)
        out.gain.setTargetAtTime(0, at, 0.07)
        for (const source of sources) source.stop(at + 0.6)
      },
    }
  }

  /** Play a note for a fixed time. */
  note(frequency: number, seconds: number, level = 1) {
    const voice = this.noteOn(frequency, level)
    setTimeout(() => voice.stop(), seconds * 1000)
  }

  private pluck(ctx: AudioContext, bus: AudioNode, frequency: number, when: number, decay: number, level: number) {
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, when)
    gain.gain.linearRampToValueAtTime(level, when + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + decay)
    gain.connect(bus)
    for (const [type, mix] of [
      ['sine', 1],
      ['triangle', 0.35],
    ] as const) {
      const osc = ctx.createOscillator()
      osc.type = type
      osc.frequency.value = frequency
      const partial = ctx.createGain()
      partial.gain.value = mix
      osc.connect(partial)
      partial.connect(gain)
      osc.start(when)
      osc.stop(when + decay + 0.05)
    }
  }

  /** The secret-found jingle, on a harp-like pluck. */
  secret(delay = 0) {
    const live = this.live()
    if (!live) return
    const start = live.ctx.currentTime + delay
    SECRET_JINGLE.forEach((frequency, i) => {
      const last = i === SECRET_JINGLE.length - 1
      this.pluck(live.ctx, live.bus, frequency, start + i * 0.105, last ? 2.2 : 0.7, last ? 0.2 : 0.15)
    })
  }

  /** A rising, shimmering sweep for time travel and the launch. */
  shimmer(seconds = 1.8) {
    const live = this.live()
    if (!live) return
    const { ctx, bus } = live
    const t = ctx.currentTime
    const sweep = ctx.createBufferSource()
    sweep.buffer = this.noiseBuffer(ctx)
    sweep.loop = true
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 6
    band.frequency.setValueAtTime(260, t)
    band.frequency.exponentialRampToValueAtTime(5200, t + seconds)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.16, t + seconds * 0.6)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds)
    sweep.connect(band)
    band.connect(gain)
    gain.connect(bus)
    sweep.start(t)
    sweep.stop(t + seconds + 0.1)
    // D major, high and bell-like, blooming at the top of the sweep.
    for (const [i, frequency] of [1174.66, 1479.98, 1760.0, 2349.32].entries()) {
      this.pluck(ctx, bus, frequency, t + seconds * 0.55 + i * 0.07, 2.4, 0.06)
    }
  }

  /** Steady rain for the Song of Storms. */
  setRain(on: boolean) {
    const live = this.live()
    if (!live) return
    const { ctx, bus } = live
    const t = ctx.currentTime
    if (on && !this.rain) {
      const source = ctx.createBufferSource()
      source.buffer = this.noiseBuffer(ctx)
      source.loop = true
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 2400
      const highpass = ctx.createBiquadFilter()
      highpass.type = 'highpass'
      highpass.frequency.value = 500
      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.07, t + 2.5)
      source.connect(highpass)
      highpass.connect(lowpass)
      lowpass.connect(gain)
      gain.connect(bus)
      source.start(t)
      this.rain = { source, gain }
    } else if (!on && this.rain) {
      const { source, gain } = this.rain
      holdAt(gain.gain, t)
      gain.gain.setTargetAtTime(0, t, 0.8)
      source.stop(t + 4)
      this.rain = null
    }
  }

  /** A distant roll of thunder. */
  thunder(delay = 0) {
    const live = this.live()
    if (!live) return
    const { ctx, bus } = live
    const t = ctx.currentTime + delay
    const source = ctx.createBufferSource()
    source.buffer = this.noiseBuffer(ctx)
    source.loop = true
    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.setValueAtTime(420, t)
    lowpass.frequency.exponentialRampToValueAtTime(90, t + 3)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.5, t + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2)
    source.connect(lowpass)
    lowpass.connect(gain)
    gain.connect(bus)
    source.start(t)
    source.stop(t + 3.3)
  }
}

/** Stereo, exponentially decaying noise: a cheap, convincing stone-hall reverb. */
function impulseResponse(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3.2
  }
  return buffer
}

export const synth = new Synth()
