import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toolCallInputs } from '../src/grade/tool-calls.ts'

test('reads tool calls from every harness format, and never their output', () => {
  const transcript = [
    { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/work/.bench/shots/003-390x844.png' } }] } },
    { type: 'tool_use', part: { tool: 'bash', state: { input: { command: 'ls app/src' }, output: 'see /work/.bench/shots/009-1440x900.png' } } },
    { type: 'item.completed', item: { type: 'function_call', name: 'view_image', arguments: '{"path":".bench/shots/005-1440x900.png"}' } },
    'plain harness chatter',
  ].map((event) => (typeof event === 'string' ? event : JSON.stringify(event))).join('\n')
  assert.deepEqual(toolCallInputs(transcript), ['/work/.bench/shots/003-390x844.png', 'ls app/src', '.bench/shots/005-1440x900.png'])
})

test("rebuilds Jcode's tool calls from the input it streams in pieces", () => {
  const pieces = (input: object) => JSON.stringify(input).match(/.{1,7}/g)!.map((delta) => ({ type: 'tool_input', delta }))
  const transcript = [
    { type: 'tool_start', id: 'toolu_1', name: 'read' },
    ...pieces({ file_path: '/work/.bench/shots/004-390x844.png' }),
    { type: 'tool_exec', id: 'toolu_1', name: 'read' },
    { type: 'tool_done', id: 'toolu_1', name: 'read', output: 'see /work/.bench/shots/009-1440x900.png', error: null },
    { type: 'tool_start', id: 'toolu_2', name: 'bash' },
    ...pieces({ command: './shot --width 390', intent: 'Look at the phone layout' }),
    { type: 'tool_exec', id: 'toolu_2', name: 'bash' },
  ].map((event) => JSON.stringify(event)).join('\n')
  assert.deepEqual(toolCallInputs(transcript), ['/work/.bench/shots/004-390x844.png', './shot --width 390'])
})
