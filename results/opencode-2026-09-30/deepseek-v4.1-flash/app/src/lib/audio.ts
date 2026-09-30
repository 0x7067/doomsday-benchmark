/**
 * Tiny Web Audio instrument. Nothing is loaded from the network — every sound
 * is synthesised, which keeps the page fully offline and weightless.
 *
 * The AudioContext is created lazily on the first user gesture, as browsers
 * require.
 */

let context: AudioContext | null = null
let master: GainNode | null = null
let muted = false

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    context = new Ctor()
    master = context.createGain()
    master.gain.value = muted ? 0 : 0.7
    master.connect(context.destination)
  }
  if (context.state === 'suspended') void context.resume()
  return context
}

function output(): GainNode | null {
  audio()
  return master
}

/** Master mute for every synthesised sound. */
export function setMuted(value: boolean): void {
  muted = value
  if (master && context) {
    master.gain.setTargetAtTime(value ? 0 : 0.7, context.currentTime, 0.02)
  }
}

type PluckOptions = {
  frequency: number
  duration: number
  gain: number
  /** Second and third partials shape the timbre. */
  partials?: number[]
  vibrato?: boolean
}

function voice({ frequency, duration, gain, partials = [1, 2.001], vibrato = false }: PluckOptions): void {
  const ctx = audio()
  const destination = output()
  if (!ctx || !destination) return

  const start = ctx.currentTime
  const envelope = ctx.createGain()
  envelope.gain.setValueAtTime(0, start)
  envelope.gain.linearRampToValueAtTime(gain, start + 0.018)
  envelope.gain.exponentialRampToValueAtTime(gain * 0.34, start + Math.min(0.35, duration * 0.5))
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  envelope.connect(destination)

  partials.forEach((ratio, index) => {
    const oscillator = ctx.createOscillator()
    oscillator.type = index === 0 ? 'sine' : 'triangle'
    oscillator.frequency.value = frequency * ratio
    const partialGain = ctx.createGain()
    partialGain.gain.value = index === 0 ? 1 : 0.12 / index
    oscillator.connect(partialGain)
    partialGain.connect(envelope)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.05)
  })

  if (vibrato) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 5.2
    const depth = ctx.createGain()
    depth.gain.value = frequency * 0.006
    lfo.connect(depth)
    const carrier = ctx.createOscillator()
    carrier.type = 'sine'
    carrier.frequency.value = frequency
    depth.connect(carrier.frequency)
    const breath = ctx.createGain()
    breath.gain.setValueAtTime(0, start)
    breath.gain.linearRampToValueAtTime(0.18, start + 0.12)
    breath.gain.exponentialRampToValueAtTime(0.0001, start + duration)
    carrier.connect(breath)
    breath.connect(envelope)
    lfo.start(start)
    carrier.start(start)
    lfo.stop(start + duration)
    carrier.stop(start + duration + 0.05)
  }
}

/** A warm, breathy ocarina note. */
export function playOcarinaNote(frequency: number, duration = 1.1): void {
  voice({ frequency, duration, gain: 0.3, partials: [1, 2.002, 3.01], vibrato: true })
}

/** A soft glass bell — used for Navi and for the release moment. */
export function playChime(frequencies: number[] = [1318.5, 1760, 2093.0], duration = 2.6): void {
  frequencies.forEach((frequency, index) => {
    window.setTimeout(() => {
      voice({ frequency, duration: duration - index * 0.2, gain: 0.16, partials: [1, 2.01, 2.98, 4.16] })
    }, index * 110)
  })
}
