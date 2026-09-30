/**
 * The Ocarina of Time, rebuilt in about two hundred lines of Web Audio.
 *
 * No samples: the instrument is a filtered stack of oscillators with a breath
 * transient and a synthesised plate reverb, which keeps the whole site
 * self-hosted and weighs about 4 kB of JavaScript.
 */

export const OCARINA_KEYS = [
  { id: 'left', label: 'C ◀', name: 'C-Left', offset: 7 },
  { id: 'up', label: 'C ▲', name: 'C-Up', offset: 3 },
  { id: 'right', label: 'C ▶', name: 'C-Right', offset: 0 },
  { id: 'a', label: 'A', name: 'A-Button', offset: 5 },
  { id: 'down', label: 'C ▼', name: 'C-Down', offset: 8 },
] as const

export type OcarinaKeyId = (typeof OCARINA_KEYS)[number]['id']

/** Transposition positions, named for the lowest note each one produces. */
export const OCARINA_PITCHES = [
  { id: 0, label: 'A3', hz: 220 },
  { id: 1, label: 'E4', hz: 329.63 },
  { id: 2, label: 'A4', hz: 440 },
  { id: 3, label: 'E5', hz: 659.25 },
] as const

export const DEFAULT_PITCH = 2

/**
 * The Song of Time, as documented: C-Right, A, C-Down, twice.
 * At the default transposition that is the A — D — F figure the original
 * actually plays, so the reward for getting it right is the real tune.
 */
export const SONG_OF_TIME: readonly OcarinaKeyId[] = ['right', 'a', 'down', 'right', 'a', 'down']

const SEMITONE = 2 ** (1 / 12)

/**
 * Note names, indexed from A rather than C so the Song of Time reads A–D–F.
 * MIDI pitch class 9 is A4, hence the +3 when mapping a MIDI number onto it.
 */
const NOTE_NAMES = ['A', 'A♯', 'B', 'C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯']

export function noteName(hz: number): string {
  const midi = Math.round(12 * Math.log2(hz / 440) + 69)
  return `${NOTE_NAMES[(((midi + 3) % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`
}

export function frequencyFor(keyId: OcarinaKeyId, pitchIndex: number): number {
  const key = OCARINA_KEYS.find((entry) => entry.id === keyId)
  const pitch = OCARINA_PITCHES[Math.max(0, Math.min(OCARINA_PITCHES.length - 1, pitchIndex))]
  if (!key) return pitch.hz
  return pitch.hz * SEMITONE ** (key.offset / 12)
}

export interface OcarinaVoice {
  /** One breath on one hole. Resolves when the note has fully decayed. */
  play(hz: number, duration?: number): void
  /** A stacked chord, for rewards and fanfares. */
  chord(hzList: readonly number[], duration?: number): void
  /** True once a user gesture has unlocked the audio context. */
  readonly ready: boolean
  readonly enabled: boolean
  setEnabled(enabled: boolean): void
  dispose(): void
}

export function createOcarina(): OcarinaVoice {
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let reverbSend: GainNode | null = null
  let noiseBuffer: AudioBuffer | null = null
  let enabled = true
  let disposed = false

  /** Lazily built on the first gesture, so nothing ever fights autoplay policy. */
  const ensure = (): AudioContext | null => {
    if (disposed || !enabled) return null
    if (context) {
      if (context.state === 'suspended') void context.resume()
      return context
    }

    const Ctor =
      window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null

    context = new Ctor()
    master = context.createGain()
    master.gain.value = 0.5

    const shelf = context.createBiquadFilter()
    shelf.type = 'highshelf'
    shelf.frequency.value = 3200
    shelf.gain.value = -6

    const plate = context.createConvolver()
    plate.buffer = buildImpulse(context, 1.9, 2.6)

    reverbSend = context.createGain()
    reverbSend.gain.value = 0.34

    reverbSend.connect(plate)
    plate.connect(master)
    master.connect(shelf)
    shelf.connect(context.destination)

    noiseBuffer = buildNoise(context, 0.5)
    return context
  }

  const voice = (hz: number, duration: number, at: number, gain: number) => {
    if (!context || !master || !reverbSend) return

    // Voice -> tone filter -> envelope -> [dry, reverb send]
    const tone = context.createBiquadFilter()
    tone.type = 'lowpass'
    tone.Q.value = 0.9
    tone.frequency.setValueAtTime(Math.min(9000, hz * 9), at)
    tone.frequency.exponentialRampToValueAtTime(Math.max(400, hz * 3.2), at + duration)

    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0.0001, at)

    tone.connect(envelope)
    envelope.connect(master)
    envelope.connect(reverbSend)

    // Body: a fundamental with a soft octave and twelfth layered over it. The
    // upper partials are what make a clay ocarina sound reedy rather than pure.
    const partials: ReadonlyArray<readonly [ratio: number, level: number, type: OscillatorType]> = [
      [1, 1, 'sine'],
      [2, 0.32, 'sine'],
      [3, 0.14, 'triangle'],
      [4, 0.06, 'sine'],
    ]

    const stop = at + duration + 0.35
    const oscs: OscillatorNode[] = []

    for (const [ratio, level, type] of partials) {
      const osc = context.createOscillator()
      const partialGain = context.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(hz * ratio, at)
      // A touch of downward glide on the attack; clay is never perfectly in tune.
      osc.detune.setValueAtTime(6, at)
      osc.detune.linearRampToValueAtTime(0, at + 0.12)
      partialGain.gain.value = level
      osc.connect(partialGain)
      partialGain.connect(tone)
      osc.start(at)
      osc.stop(stop)
      oscs.push(osc)
    }

    // Vibrato, gently delayed so the attack stays pure. It sums into the same
    // `detune` params the glide above writes to, so the whole voice wavers.
    const vibrato = context.createOscillator()
    const vibratoDepth = context.createGain()
    vibrato.frequency.value = 5.1
    vibratoDepth.gain.setValueAtTime(0, at)
    vibratoDepth.gain.linearRampToValueAtTime(4.5, at + Math.min(0.35, duration * 0.5))
    vibrato.connect(vibratoDepth)
    for (const osc of oscs) vibratoDepth.connect(osc.detune)
    vibrato.start(at)
    vibrato.stop(stop)

    envelope.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * 0.72), at + 0.045)
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration)

    // Breath: a short noise burst shaped like an attack transient.
    if (noiseBuffer) {
      const breath = context.createBufferSource()
      const breathFilter = context.createBiquadFilter()
      const breathGain = context.createGain()
      breath.buffer = noiseBuffer
      breathFilter.type = 'bandpass'
      breathFilter.frequency.value = hz * 4
      breathFilter.Q.value = 0.7
      breathGain.gain.setValueAtTime(gain * 0.16, at)
      breathGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.16)
      breath.connect(breathFilter)
      breathFilter.connect(breathGain)
      breathGain.connect(master)
      breath.start(at)
      breath.stop(at + 0.2)
    }
  }

  return {
    play(hz, duration = 0.85) {
      const ctx = ensure()
      if (!ctx) return
      voice(hz, duration, ctx.currentTime + 0.001, 0.3)
    },
    chord(hzList, duration = 1.6) {
      const ctx = ensure()
      if (!ctx) return
      const at = ctx.currentTime + 0.01
      hzList.forEach((hz, index) => {
        voice(hz, duration, at + index * 0.07, 0.19)
      })
    },
    get ready() {
      return context !== null
    },
    get enabled() {
      return enabled
    },
    setEnabled(next) {
      enabled = next
      if (!next && context) void context.suspend()
      if (next && context) void context.resume()
    },
    dispose() {
      disposed = true
      if (context) void context.close()
      context = null
      master = null
      reverbSend = null
    },
  }
}

/** A decaying noise burst — a serviceable stand-in for a stone hall. */
function buildImpulse(context: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds)
  const buffer = context.createBuffer(2, length, context.sampleRate)
  for (let channel = 0; channel < 2; channel += 1) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i += 1) {
      const t = i / length
      // Slight inter-channel decorrelation so it reads as space, not a hiss.
      const jitter = channel === 0 ? 1 : 0.94
      data[i] = (Math.random() * 2 - 1) * (1 - t) ** decay * jitter
    }
  }
  return buffer
}

function buildNoise(context: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(context.sampleRate * seconds)
  const buffer = context.createBuffer(1, length, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1
  return buffer
}
