import fs from 'node:fs'
import type { Page } from 'playwright'
import sharp from 'sharp'

/*
 * Judges can't listen, so the grader records what a page plays and turns it
 * into things they can read: a spectrogram (pitch over time), a waveform
 * (loudness over time), a few measurements, and the notes it detects.
 *
 * Recording works by hooking Web Audio in the page: everything any audio
 * context sends to its speakers is also copied into a recorder. Media
 * elements aren't captured, since every V1 page with sound synthesised it.
 */

export interface Recording {
  rate: number
  samples: Int16Array
}

export interface SoundAnalysis {
  seconds: number
  /** Share of the recording above −50 dBFS. */
  activeShare: number
  /** Average level of the active part, in dBFS. */
  rmsDb: number | null
  peakDb: number | null
  /** Share of samples at full scale, which sounds like distortion. */
  clippedShare: number
  /** Spread between loud and quiet moments of the active part, in dB (95th minus 10th percentile of 400 ms levels). */
  dynamicRangeDb: number | null
  /** How much the spectrum changes from one moment to the next, 0 (a frozen tone) to 1. */
  spectralChange: number | null
  /** Notes whose onsets were detected, as name and time, such as "D4@0.50s". */
  notes: string[]
}

/**
 * Installed with `page.addInitScript` before the page's own code runs. It
 * counts audio contexts and records everything they send to their speakers.
 */
export function installAudioTap(): void {
  // Each chunk keeps the time it was played, so silence before the first sound, and several contexts, line up.
  const recorder = { rate: 0, chunks: [] as { at: number; data: Int16Array }[], contexts: 0, recording: false, startedAt: 0 }
  // One signature for both overloads (connecting to a node or to a parameter).
  const connect = AudioNode.prototype.connect as (this: AudioNode, target: AudioNode | AudioParam, ...rest: number[]) => AudioNode | void
  const taps = new WeakMap<BaseAudioContext, ScriptProcessorNode>()
  const tapFor = (context: BaseAudioContext) => {
    let tap = taps.get(context)
    if (!tap) {
      tap = context.createScriptProcessor(4096, 2, 2)
      const silent = context.createGain()
      silent.gain.value = 0
      connect.call(tap, silent)
      connect.call(silent, context.destination)
      recorder.rate = context.sampleRate
      recorder.contexts += 1
      tap.onaudioprocess = (event) => {
        if (!recorder.recording) return
        const left = event.inputBuffer.getChannelData(0)
        const right = event.inputBuffer.getChannelData(1)
        const mono = new Int16Array(left.length)
        for (let i = 0; i < left.length; i++) mono[i] = Math.max(-1, Math.min(1, (left[i] + right[i]) / 2)) * 32767
        // The buffer handed over now was rendered one buffer's length ago.
        const at = (performance.now() - recorder.startedAt) / 1000 - left.length / context.sampleRate
        recorder.chunks.push({ at: Math.max(0, at), data: mono })
      }
      taps.set(context, tap)
    }
    return tap
  }
  AudioNode.prototype.connect = function (this: AudioNode, target: AudioNode | AudioParam, ...rest: number[]) {
    if (target instanceof AudioDestinationNode) connect.call(this, tapFor(this.context))
    return connect.call(this, target, ...rest)
  } as typeof AudioNode.prototype.connect
  Object.assign(window, { __benchAudio: recorder })
}

interface PageRecorder {
  rate: number
  chunks: { at: number; data: Int16Array }[]
  contexts: number
  recording: boolean
  startedAt: number
}

/** Starts collecting what the page plays, dropping anything collected before. Time zero is now. */
export async function startRecording(page: Page): Promise<void> {
  await page.evaluate(() => {
    const recorder = (window as unknown as { __benchAudio?: PageRecorder }).__benchAudio
    if (recorder) Object.assign(recorder, { chunks: [], recording: true, startedAt: performance.now() })
  })
}

/** The level of the last chunk the recorder received, in dBFS, or null before any. */
export async function recentLevel(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const chunk = (window as unknown as { __benchAudio?: PageRecorder }).__benchAudio?.chunks.at(-1)?.data
    if (!chunk?.length) return null
    let sum = 0
    for (const sample of chunk) sum += (sample / 32768) ** 2
    return 10 * Math.log10(sum / chunk.length + 1e-12)
  })
}

/** Stops recording and returns what was played since `startRecording`, plus how many audio contexts the page has made. */
export async function stopRecording(page: Page): Promise<{ recording: Recording | null; contexts: number }> {
  const { rate, pcm, contexts } = await page.evaluate(() => {
    const recorder = (window as unknown as { __benchAudio?: PageRecorder }).__benchAudio
    if (!recorder) return { rate: 0, pcm: '', contexts: 0 }
    recorder.recording = false
    if (!recorder.chunks.length) return { rate: recorder.rate, pcm: '', contexts: recorder.contexts }
    // Place each chunk at its time, mixing where contexts overlap, from time zero to the end of the last chunk.
    const end = Math.max(...recorder.chunks.map((c) => Math.round(c.at * recorder.rate) + c.data.length))
    const mix = new Float32Array(end)
    for (const { at, data } of recorder.chunks) {
      const offset = Math.round(at * recorder.rate)
      for (let i = 0; i < data.length; i++) mix[offset + i] += data[i]
    }
    const all = Int16Array.from(mix, (value) => Math.max(-32768, Math.min(32767, value)))
    const bytes = new Uint8Array(all.buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    return { rate: recorder.rate, pcm: btoa(binary), contexts: recorder.contexts }
  })
  if (!rate || !pcm) return { recording: null, contexts }
  const buffer = Buffer.from(pcm, 'base64')
  return { recording: { rate, samples: new Int16Array(buffer.buffer, buffer.byteOffset, buffer.length / 2) }, contexts }
}

const ACTIVE_DB = -50
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

export function analyzeSound({ rate, samples }: Recording): SoundAnalysis {
  const signal = Float64Array.from(samples, (s) => s / 32768)
  const levels = windowLevels(signal, Math.round(rate * 0.05))
  const active = levels.filter((db) => db > ACTIVE_DB)
  const activePower = active.map((db) => 10 ** (db / 10))
  let peak = 0
  let clipped = 0
  for (const s of samples) {
    peak = Math.max(peak, Math.abs(s))
    if (Math.abs(s) >= 32700) clipped += 1
  }
  const shortTerm = windowLevels(signal, Math.round(rate * 0.4), Math.round(rate * 0.1)).filter((db) => db > ACTIVE_DB).sort((a, b) => a - b)
  const percentile = (p: number) => shortTerm[Math.min(shortTerm.length - 1, Math.floor(p * shortTerm.length))]
  return {
    seconds: round(samples.length / rate, 1),
    activeShare: levels.length ? round(active.length / levels.length, 2) : 0,
    rmsDb: active.length ? round(10 * Math.log10(activePower.reduce((a, b) => a + b, 0) / active.length), 1) : null,
    peakDb: peak ? round(20 * Math.log10(peak / 32768), 1) : null,
    clippedShare: samples.length ? round(clipped / samples.length, 4) : 0,
    dynamicRangeDb: shortTerm.length > 2 ? round(percentile(0.95) - percentile(0.1), 1) : null,
    spectralChange: spectralChange(signal),
    notes: detectNotes(signal, rate),
  }
}

/** Level in dBFS of consecutive windows. */
function windowLevels(signal: Float64Array, size: number, hop = size): number[] {
  const levels: number[] = []
  for (let start = 0; start + size <= signal.length; start += hop) {
    let sum = 0
    for (let i = start; i < start + size; i++) sum += signal[i] ** 2
    levels.push(10 * Math.log10(sum / size + 1e-12))
  }
  return levels
}

/** Average of 1 − cosine similarity between neighbouring magnitude spectra, over frames with sound in them. */
function spectralChange(signal: Float64Array): number | null {
  const size = 2048
  const spectra: Float64Array[] = []
  for (let start = 0; start + size <= signal.length; start += size) {
    const frame = signal.subarray(start, start + size)
    if (10 * Math.log10(frame.reduce((sum, s) => sum + s * s, 0) / size + 1e-12) > ACTIVE_DB) spectra.push(magnitudes(frame))
  }
  if (spectra.length < 3) return null
  let total = 0
  for (let i = 1; i < spectra.length; i++) total += 1 - cosine(spectra[i - 1], spectra[i])
  return round(total / (spectra.length - 1), 3)
}

function cosine(a: Float64Array, b: Float64Array): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] ** 2
    normB += b[i] ** 2
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 1
}

/**
 * Onsets are jumps in loudness; each note's pitch is the semitone whose
 * fundamental and first harmonics carry the most energy just after it.
 */
function detectNotes(signal: Float64Array, rate: number): string[] {
  const hop = Math.round(rate * 0.01)
  const rms: number[] = []
  for (let start = 0; start + hop <= signal.length; start += hop) {
    let sum = 0
    for (let i = start; i < start + hop; i++) sum += signal[i] ** 2
    rms.push(Math.sqrt(sum / hop))
  }
  const onsets: number[] = []
  for (let k = 3; k < rms.length; k++) {
    // Loudness at least doubles over 30 ms, above a floor, at least 150 ms after the last onset.
    if (rms[k] > 0.01 && rms[k] > 2 * rms[k - 3] && (onsets.length === 0 || k - onsets.at(-1)! > 15)) onsets.push(k)
  }
  const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12)
  return onsets.slice(0, 40).flatMap((k) => {
    const start = (k + 5) * hop
    const length = Math.min(Math.round(rate * 0.15), signal.length - start)
    if (length < rate * 0.05) return []
    let best = { midi: 0, energy: 0 }
    for (let midi = 45; midi <= 88; midi++) {
      const energy = [1, 0.5, 0.33].reduce((sum, weight, i) => sum + weight * goertzel(signal, start, length, frequency(midi) * (i + 1), rate), 0)
      if (energy > best.energy) best = { midi, energy }
    }
    return [`${NOTE_NAMES[best.midi % 12]}${Math.floor(best.midi / 12) - 1}@${((k * hop) / rate).toFixed(2)}s`]
  })
}

/** Magnitude of one frequency over a Hann-windowed stretch of the signal. */
function goertzel(signal: Float64Array, start: number, length: number, frequency: number, rate: number): number {
  const coefficient = 2 * Math.cos((2 * Math.PI * frequency) / rate)
  let previous = 0
  let beforePrevious = 0
  for (let i = 0; i < length; i++) {
    const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (length - 1))
    const current = signal[start + i] * hann + coefficient * previous - beforePrevious
    beforePrevious = previous
    previous = current
  }
  return Math.sqrt(Math.max(0, previous ** 2 + beforePrevious ** 2 - coefficient * previous * beforePrevious))
}

/** Magnitude spectrum of a Hann-windowed frame whose length is a power of two. */
function magnitudes(frame: Float64Array): Float64Array {
  const n = frame.length
  const real = Float64Array.from(frame, (s, i) => s * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))))
  const imag = new Float64Array(n)
  // Iterative radix-2 FFT.
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[real[i], real[j]] = [real[j], real[i]]
      ;[imag[i], imag[j]] = [imag[j], imag[i]]
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = (-2 * Math.PI) / size
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < size / 2; k++) {
        const [cos, sin] = [Math.cos(angle * k), Math.sin(angle * k)]
        const [a, b] = [start + k, start + k + size / 2]
        const tr = real[b] * cos - imag[b] * sin
        const ti = real[b] * sin + imag[b] * cos
        real[b] = real[a] - tr
        imag[b] = imag[a] - ti
        real[a] += tr
        imag[a] += ti
      }
    }
  }
  return Float64Array.from({ length: n / 2 }, (_, i) => Math.hypot(real[i], imag[i]))
}

const SPECTROGRAM = { width: 900, height: 240, waveform: 80, axis: 22, lowHz: 60, highHz: 6000 }

/** A spectrogram over a waveform strip, labelled, as a PNG a judge can open. */
export async function writeSoundImage(file: string, { rate, samples }: Recording, title: string): Promise<void> {
  const { width, height, waveform, axis, lowHz, highHz } = SPECTROGRAM
  const signal = Float64Array.from(samples, (s) => s / 32768)
  const size = 2048
  const hop = Math.max(1, Math.floor((signal.length - size) / width))
  const pixels = Buffer.alloc(width * (height + waveform) * 3)
  for (let x = 0; x < width; x++) {
    const start = x * hop
    if (start + size > signal.length) break
    const spectrum = magnitudes(signal.subarray(start, start + size))
    for (let y = 0; y < height; y++) {
      // Rows are spaced logarithmically from highHz at the top to lowHz at the bottom.
      const hz = highHz * (lowHz / highHz) ** (y / (height - 1))
      const db = 20 * Math.log10(spectrum[Math.round((hz * size) / rate)] / (size / 4) + 1e-9)
      heat(pixels, (y * width + x) * 3, Math.max(0, Math.min(1, (db + 100) / 100)))
    }
    let peak = 0
    for (let i = start; i < start + hop && i < signal.length; i++) peak = Math.max(peak, Math.abs(signal[i]))
    const half = Math.round((peak * waveform) / 2)
    for (let y = waveform / 2 - half; y < waveform / 2 + half; y++) pixels.set([244, 183, 64], ((height + y) * width + x) * 3)
  }
  const seconds = samples.length / rate
  const labels = [100, 250, 500, 1000, 2000, 4000].map((hz) => {
    const y = Math.round(((Math.log(highHz / hz) / Math.log(highHz / lowHz)) * (height - 1)) + axis)
    return `<text x="4" y="${y + 4}" font-size="12" fill="#ddd">${hz >= 1000 ? `${hz / 1000}k` : hz}</text>`
  })
  const times = [0, 0.25, 0.5, 0.75, 1].map((f) => `<text x="${Math.round(60 + f * (width - 30))}" y="${axis + height + waveform + 16}" font-size="12" fill="#ddd">${(f * seconds).toFixed(1)}s</text>`)
  const frame = Buffer.from(
    `<svg width="${width + 60}" height="${height + waveform + axis * 2}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0b0d10"/><text x="60" y="15" font-size="13" font-family="Helvetica" fill="#f4b740">${escapeXml(title)}</text>${labels.join('')}<text x="4" y="${axis + height + waveform / 2 + 4}" font-size="11" fill="#ddd">level</text>${times.join('')}</svg>`,
  )
  const plot = await sharp(pixels, { raw: { width, height: height + waveform, channels: 3 } }).png().toBuffer()
  await sharp(frame).composite([{ input: plot, left: 50, top: axis }]).png().toFile(file)
}

/** Black through purple, red and yellow to white. */
function heat(pixels: Buffer, offset: number, value: number): void {
  const stops = [[0, 0, 0], [60, 10, 90], [190, 30, 50], [250, 170, 30], [255, 255, 220]]
  const position = value * (stops.length - 1)
  const low = Math.floor(position)
  const high = Math.min(stops.length - 1, low + 1)
  const t = position - low
  for (let c = 0; c < 3; c++) pixels[offset + c] = Math.round(stops[low][c] + (stops[high][c] - stops[low][c]) * t)
}

export function writeWav(file: string, { rate, samples }: Recording): void {
  const data = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength)
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVEfmt ', 8)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(rate, 24)
  header.writeUInt32LE(rate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  fs.writeFileSync(file, Buffer.concat([header, data]))
}

function round(value: number, digits: number): number {
  return Math.round(value * 10 ** digits) / 10 ** digits
}

function escapeXml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]!)
}
