import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { findOutsideAccess } from '../src/grade/boundary.ts'
import { BENCH_ROOT } from '../src/paths.ts'

const rubrics = path.join(BENCH_ROOT, 'src', 'grade', 'rubrics.ts')
const shot = path.join(BENCH_ROOT, 'src', 'shot.ts')

function withRun(check: (root: string) => void) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'doomsday-run-'))
  try {
    fs.writeFileSync(path.join(root, 'BRIEF.md'), '')
    check(root)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

test("flags the agent's own reads of benchmark files, in Claude Code and OpenCode transcripts", () => {
  withRun((root) => {
    const transcript = [
      { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', input: { file_path: rubrics } }] } },
      { type: 'tool_use', part: { tool: 'bash', state: { input: { command: `cat ${path.join(BENCH_ROOT, 'README.md')} | head` }, output: '' } } },
    ].map((event) => JSON.stringify(event)).join('\n')
    assert.deepEqual(findOutsideAccess(transcript, [root]).map((a) => a.area).sort(), ['benchmark files', 'grading internals'])
  })
})

test('ignores tool output, running ./shot, the run folder itself and text that only looks like a path', () => {
  withRun((root) => {
    const transcript = [
      { type: 'tool_use', part: { tool: 'bash', state: { input: { command: './shot --width 390' }, output: `Saved .bench/shots/001.png\n    at ${shot}:12` } } },
      { type: 'tool_use', part: { tool: 'bash', state: { input: { command: `node "${shot}" --run "${root}" --width 1440` } } } },
      { type: 'tool_use', part: { tool: 'read', state: { input: { filePath: path.join(root, 'BRIEF.md') } } } },
      { type: 'tool_use', part: { tool: 'bash', state: { input: { command: "sed -i '' 's/width: 120px/width: ~105px/' app/src/App.css" } } } },
    ].map((event) => JSON.stringify(event)).join('\n')
    assert.deepEqual(findOutsideAccess(transcript, [root]), [])
  })
})

test('counts paths on the machine the run was made on, when it is regraded on another', () => {
  withRun((root) => {
    const theirHome = '/Users/someone-else'
    const theirBench = `${theirHome}/dev/doomsday-benchmark`
    const theirRun = `${theirBench}/runs/ocarina-remake_jcode_2026-10-01T17-12-20`
    fs.writeFileSync(path.join(root, 'shot'), `#!/bin/sh\nexec node "${theirBench}/src/shot.ts" --run "${theirRun}" "$@"\n`)
    const transcript = [
      { type: 'tool_use', part: { tool: 'write', state: { input: { filePath: `${theirHome}/.jcode/scratch/preview.png` } } } },
      { type: 'tool_use', part: { tool: 'read', state: { input: { filePath: `${theirBench}/src/grade/rubrics.ts` } } } },
      { type: 'tool_use', part: { tool: 'read', state: { input: { filePath: `${theirRun}/BRIEF.md` } } } },
      { type: 'tool_use', part: { tool: 'bash', state: { input: { command: `ls ${theirHome}/.npm/_cacache` } } } },
    ].map((event) => JSON.stringify(event)).join('\n')
    assert.deepEqual(findOutsideAccess(transcript, [root, theirRun]), [
      { area: 'home directory', paths: [`${theirHome}/.jcode/scratch/preview.png`] },
      { area: 'grading internals', paths: [`${theirBench}/src/grade/rubrics.ts`] },
    ])
  })
})

test("counts the folders a harness hands the agent in a variable, like Jcode's scratch folder", () => {
  withRun((root) => {
    const command = 'mkdir -p $JCODE_SCRATCH_DIR/v && sips -s format jpeg assets/a.avif --out ${JCODE_SCRATCH_DIR}/v/a.jpg; echo $HOME'
    const transcript = [
      { type: 'tool_start', id: 'toolu_1', name: 'bash' },
      { type: 'tool_input', delta: JSON.stringify({ command }) },
      { type: 'tool_exec', id: 'toolu_1', name: 'bash' },
    ].map((event) => JSON.stringify(event)).join('\n')
    assert.deepEqual(findOutsideAccess(transcript, [root]), [{ area: 'home directory', paths: ['~/.jcode/scratch/v', '~/.jcode/scratch/v/a.jpg'] }])
  })
})
