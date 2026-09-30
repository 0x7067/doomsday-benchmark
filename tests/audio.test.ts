import assert from 'node:assert/strict'
import { test } from 'node:test'
import { analyzeSound, type Recording } from '../src/grade/audio.ts'

const RATE = 48_000

/** Sine tones, each preceded by silence, at the given frequencies. */
function melody(frequencies: number[], noteSeconds = 0.4, gapSeconds = 0.15): Recording {
  const perNote = Math.round((noteSeconds + gapSeconds) * RATE)
  const samples = new Int16Array(perNote * frequencies.length + RATE / 2)
  frequencies.forEach((hz, n) => {
    const start = n * perNote + Math.round(gapSeconds * RATE)
    for (let i = 0; i < noteSeconds * RATE; i++) samples[start + i] = Math.round(8_000 * Math.sin((2 * Math.PI * hz * i) / RATE))
  })
  return { rate: RATE, samples }
}

test('names the notes of a melody in order', () => {
  // The Song of Storms: D4 F4 D5.
  const { notes } = analyzeSound(melody([293.66, 349.23, 587.33]))
  assert.deepEqual(notes.map((note) => note.split('@')[0]), ['D4', 'F4', 'D5'])
})

test('measures a frozen chord as unchanging', () => {
  const samples = new Int16Array(RATE * 6)
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.round([146.83, 220, 293.66, 440].reduce((sum, hz) => sum + 3_000 * Math.sin((2 * Math.PI * hz * i) / RATE), 0))
  }
  const analysis = analyzeSound({ rate: RATE, samples })
  assert.equal(analysis.activeShare, 1)
  assert.ok(analysis.spectralChange !== null && analysis.spectralChange < 0.01)
  assert.ok(analysis.dynamicRangeDb !== null && analysis.dynamicRangeDb < 1)
  assert.deepEqual(analysis.notes, [])
})

test('reports silence without levels', () => {
  const analysis = analyzeSound({ rate: RATE, samples: new Int16Array(RATE) })
  assert.equal(analysis.activeShare, 0)
  assert.equal(analysis.rmsDb, null)
  assert.equal(analysis.peakDb, null)
})
