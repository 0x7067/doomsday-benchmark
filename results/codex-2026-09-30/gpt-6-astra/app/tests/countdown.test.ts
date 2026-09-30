import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RELEASE, remaining } from '../src/countdown.ts'

test('release is midnight Eastern Standard Time', () => {
  assert.equal(RELEASE, Date.parse('2026-11-05T05:00:00Z'))
})

test('remaining time includes all four duration units', () => {
  assert.deepEqual(remaining(RELEASE - 90061000), {
    total: 90061,
    values: [1, 1, 1, 1],
    duration: 'P1DT1H1M1S',
  })
})

test('the last second remains visible until the exact release instant', () => {
  assert.equal(remaining(RELEASE - 10000).duration, 'P0DT0H0M10S')
  assert.equal(remaining(RELEASE - 1).duration, 'P0DT0H0M1S')
  assert.equal(remaining(RELEASE).duration, 'PT0S')
})

test('past release dates stay at zero', () => {
  assert.deepEqual(remaining(RELEASE + 86400000), {
    total: 0,
    values: [0, 0, 0, 0],
    duration: 'PT0S',
  })
})
