import assert from 'node:assert/strict'
import { test } from 'node:test'
import { check } from './guidelines.mjs'

const ok = {
  branch: 'feat/x',
  body: 'Closes #1\n```\nverify summary\nverify PASSED\n```\n- [x] reviewer',
  labels: [],
  files: [
    { path: 'apps/mobile/src/lib/a.ts', add: 10, del: 0 },
    { path: 'apps/mobile/src/lib/a.test.ts', add: 10, del: 0 },
  ],
  added: {},
  newDeps: [],
  suppressionsDelta: 0,
}

test('clean PR passes', () => assert.deepEqual(check(ok), []))
test('bad branch, big diff, logic without test, new dep, open box all fail', () => {
  const bad = {
    ...ok,
    branch: 'wip',
    body: 'nothing\n- [ ] x',
    files: [{ path: 'apps/mobile/src/lib/a.ts', add: 400, del: 0 }],
    newDeps: ['left-pad'],
  }
  assert.equal(check(bad).length, 7)
})
test('deps-approved label allows new deps', () =>
  assert.deepEqual(check({ ...ok, newDeps: ['x'], labels: ['deps-approved'] }), []))
test('lockfile and suppressions do not count as lines', () =>
  assert.deepEqual(
    check({ ...ok, files: [...ok.files, { path: 'pnpm-lock.yaml', add: 900, del: 0 }] }),
    [],
  ))
test('eslint-disable and .skip are caught', () =>
  assert.equal(
    check({ ...ok, added: { 'a.ts': ['// eslint-disable-next-line', "it.skip('x')"] } }).length,
    2,
  ))
