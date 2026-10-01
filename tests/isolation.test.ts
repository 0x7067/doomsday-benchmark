import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isolatedLaunch } from '../src/isolation.ts'
import { runPaths } from '../src/paths.ts'

test('mounts only the run folder and keeps the agent command and token out of the arguments', () => {
  const paths = runPaths('/tmp/runs/ocarina-remake_glm_2026-10-01T13-31-37')
  const previous = process.env.CLAUDE_CODE_OAUTH_TOKEN
  process.env.CLAUDE_CODE_OAUTH_TOKEN = 'secret-token'
  try {
    const launch = isolatedLaunch(paths, 'claude -p "$(cat BRIEF.md)"', 'claude-code', 'doomsday-agent:test')
    const bindMounts = launch.args.filter((arg, i) => launch.args[i - 1] === '-v' && arg.includes(':'))
    assert.deepEqual(bindMounts, [`${paths.root}:/work`])
    assert.ok(!launch.args.some((arg) => arg.includes('secret-token') || arg.includes('cat BRIEF.md')))
    assert.equal(launch.env.CLAUDE_CODE_OAUTH_TOKEN, 'secret-token')
    assert.equal(launch.env.AGENT_COMMAND, 'claude -p "$(cat BRIEF.md)"')
    assert.equal(launch.container, 'doomsday-ocarina-remake_glm_2026-10-01T13-31-37')
  } finally {
    if (previous === undefined) delete process.env.CLAUDE_CODE_OAUTH_TOKEN
    else process.env.CLAUDE_CODE_OAUTH_TOKEN = previous
  }
})
