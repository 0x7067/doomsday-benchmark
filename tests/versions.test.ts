import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeVersion, withoutVersionFlag } from '../src/versions.ts'

test('reads a version however it is written', () => {
  assert.equal(normalizeVersion('v1'), '1')
  assert.equal(normalizeVersion('1.0'), '1')
  assert.equal(normalizeVersion('1.1'), '1.1')
})

test('drops --version before handing arguments to another version', () => {
  assert.deepEqual(withoutVersionFlag(['grade', 'runs/x', '--version', '1', '--no-judges']), ['grade', 'runs/x', '--no-judges'])
  assert.deepEqual(withoutVersionFlag(['--version=1', 'run', '--scenario', 'ocarina-remake']), ['run', '--scenario', 'ocarina-remake'])
})
