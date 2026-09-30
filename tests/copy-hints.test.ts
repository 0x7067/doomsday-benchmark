import assert from 'node:assert/strict'
import { test } from 'node:test'
import { copyHints, timeFacts } from '../src/grade/copy-hints.ts'
import type { Scenario } from '../src/scenario.ts'

const ocarina: Scenario = {
  id: 'ocarina-remake',
  title: 'The Legend of Zelda: Ocarina of Time (remake)',
  event: 'the release of the Ocarina of Time remake on Nintendo Switch 2',
  target: '2026-11-05T00:00:00-05:00',
  targetLabel: 'November 5, 2026 at midnight Eastern Time',
}

test("flags the brief's framing and requirements, but not the subject's own words", () => {
  assert.deepEqual(copyHints('A FAN-MADE VIGIL · NOT AFFILIATED WITH NINTENDO OR MARVEL STUDIOS', ocarina).length, 1)
  assert.equal(copyHints('Front-end only: React, Vite and TypeScript, no backend', ocarina).length, 5)
  assert.deepEqual(copyHints('The Hero of Time returns in', ocarina), [])
  // A scenario about the event itself makes the word its own.
  assert.deepEqual(copyHints('Doomsday Clock', { ...ocarina, title: 'Doomsday', event: 'the end of the world' }), [])
})

test('flags testing hooks and raw machine values', () => {
  assert.equal(copyHints('Time travel: add ?now=2026-11-04T23:59:50-05:00 to the address', ocarina).length, 2)
  assert.equal(copyHints('Target · 1793854800000 ms since the epoch', ocarina).length, 2)
})

test('states whether daylight saving time applies at the moment', () => {
  const [utc, local] = timeFacts(ocarina.target, 'America/New_York')
  assert.equal(utc, 'The moment is 2026-11-05T05:00:00Z in UTC.')
  assert.match(local, /EST; standard time is in effect then, not daylight saving time/)
  assert.match(timeFacts('2026-07-05T00:00:00-04:00', 'America/New_York')[1], /daylight saving time is in effect then/)
  assert.match(timeFacts('2026-07-05T00:00:00+09:00', 'Asia/Tokyo')[1], /doesn't observe daylight saving time/)
  assert.equal(timeFacts(ocarina.target, undefined).length, 1)
})
