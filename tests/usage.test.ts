import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { readUsage } from '../src/usage.ts'

function transcriptUsage(events: unknown[], model: string | null = null) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'doomsday-usage-'))
  const file = path.join(directory, 'transcript.jsonl')
  try {
    fs.writeFileSync(file, ['transport warning', ...events.map((event) => JSON.stringify(event))].join('\n'))
    return readUsage(file, model)
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
}

function completed(usage: Record<string, unknown>) {
  return { type: 'turn.completed', usage }
}

test('Codex uses final cumulative totals without counting cache or reasoning twice', () => {
  const usage = transcriptUsage([
    completed({ input_tokens: 500, cached_input_tokens: 200, output_tokens: 50 }),
    completed({ input_tokens: 1000, cached_input_tokens: 600, cache_write_input_tokens: 100,
      output_tokens: 200, reasoning_output_tokens: 80 }),
  ], 'gpt-6.1-sol')
  assert.equal(usage?.harness, 'codex')
  assert.equal(usage?.model, 'gpt-6.1-sol')
  assert.equal(usage?.turns, 2)
  assert.deepEqual(usage?.tokens, { input: 300, cacheRead: 600, cacheWrite: 100, output: 200, reasoning: 80, total: 1200 })
  assert.equal(usage?.costUsd, 0.00291)
  assert.match(usage!.costBasis, /not a billed charge/)
})

test('Codex prices each requested model using its own cache and output rates', () => {
  const events = [completed({ input_tokens: 1000000, cached_input_tokens: 500000, output_tokens: 1000000 })]
  assert.equal(transcriptUsage(events, 'gpt-6.1-sol')?.costUsd, 11.05)
  assert.equal(transcriptUsage(events, 'gpt-6-sol')?.costUsd, 11.1)
  assert.equal(transcriptUsage(events, 'gpt-6-luna')?.costUsd, 0.555)
  assert.equal(transcriptUsage(events, 'gpt-6-astra')?.costUsd, 55.5)
})

test('older Codex events retain unknown reasoning and default cache writes to zero', () => {
  const usage = transcriptUsage([completed({ input_tokens: 100, cached_input_tokens: 40, output_tokens: 10 })])
  assert.deepEqual(usage?.tokens, { input: 60, cacheRead: 40, cacheWrite: 0, output: 10, reasoning: null, total: 110 })
  assert.equal(usage?.costUsd, null)
})

test('unknown models retain tokens without borrowing another model price', () => {
  for (const model of ['unknown-model', 'toString', '__proto__']) {
    const usage = transcriptUsage([completed({ input_tokens: 100, cached_input_tokens: 0, output_tokens: 10 })], model)
    assert.equal(usage?.tokens.total, 110)
    assert.equal(usage?.costUsd, null)
  }
})

test('failed and malformed Codex runs do not become zero-token successes', () => {
  assert.equal(transcriptUsage([{ type: 'turn.failed', error: { message: 'interrupted' } }]), null)
  for (const usage of [
    {},
    { input_tokens: 10, cached_input_tokens: 20, output_tokens: 1 },
    { input_tokens: -1, cached_input_tokens: 0, output_tokens: 1 },
    { input_tokens: 10, cached_input_tokens: 0, output_tokens: 1, reasoning_output_tokens: 2 },
    { input_tokens: 10, cached_input_tokens: 0, output_tokens: '1' },
  ]) assert.equal(transcriptUsage([completed(usage)], 'gpt-6-sol'), null)
})

test('Claude and OpenCode usage readers preserve their existing accounting', () => {
  const claude = transcriptUsage([{ type: 'result', total_cost_usd: 1.5, num_turns: 2,
    usage: { input_tokens: 100, cache_read_input_tokens: 50, output_tokens: 20 } }], 'gpt-6-sol')
  assert.equal(claude?.harness, 'claude-code')
  assert.equal(claude?.tokens.total, 170)
  assert.equal(claude?.costUsd, 1.5)
  const opencode = transcriptUsage([{ type: 'step_finish', part: { cost: 0.5,
    tokens: { input: 100, output: 20, reasoning: 10, cache: { read: 50, write: 5 } } } }], 'gpt-6-sol')
  assert.equal(opencode?.harness, 'opencode')
  assert.equal(opencode?.tokens.total, 185)
  assert.equal(opencode?.costUsd, 0.5)
})

test("Jcode's token counts add up across its model responses", () => {
  const usage = transcriptUsage([
    { type: 'start', model: 'claude-sonnet-5-5', provider: 'Claude', session_id: 'session_a' },
    { type: 'tokens', input: 1894, cache_read_input: 0, cache_creation_input: 27879, output: 211 },
    { type: 'message_end', stop_reason: 'tool_use' },
    { type: 'tokens', input: 301, cache_read_input: 179221, cache_creation_input: 988, output: 594 },
    // The final usage is the last response's alone, not the session's.
    { type: 'done', usage: { input_tokens: 301, cache_read_input_tokens: 179221, cache_creation_input_tokens: 988, output_tokens: 594 } },
  ])
  assert.equal(usage?.harness, 'jcode')
  assert.equal(usage?.model, 'claude-sonnet-5-5')
  assert.equal(usage?.turns, 2)
  assert.deepEqual(usage?.tokens, { input: 2195, cacheRead: 179221, cacheWrite: 28867, output: 805, reasoning: null, total: 211088 })
  assert.equal(usage?.costUsd, null)
})
