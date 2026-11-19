import assert from 'node:assert/strict'
import { test } from 'node:test'
import { check } from './guidelines.mjs'

const ok = {
  branch: 'feat/x',
  body: 'Closes #1\n- [x] reviewer',
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
test('bad branch, logic without test, new dep, open box all fail', () => {
  const bad = {
    ...ok,
    branch: 'wip',
    body: 'nothing\n- [ ] x',
    files: [{ path: 'apps/mobile/src/lib/a.ts', add: 4, del: 0 }],
    newDeps: ['left-pad'],
  }
  assert.equal(check(bad).length, 5)
})
test('deps-approved label allows new deps', () =>
  assert.deepEqual(check({ ...ok, newDeps: ['x'], labels: ['deps-approved'] }), []))
test('size is not a rule', () =>
  assert.deepEqual(check({ ...ok, files: [{ ...ok.files[0], add: 5000 }, ok.files[1]] }), []))
test('UI change needs a test, and an e2e spec counts', () => {
  const ui = { path: 'apps/mobile/src/app/(auth)/onboarding/5.tsx', add: 50, del: 0 }
  assert.equal(check({ ...ok, files: [ui] }).length, 1)
  assert.deepEqual(
    check({ ...ok, files: [ui, { path: 'e2e/screens.spec.ts', add: 2, del: 0 }] }),
    [],
  )
})
test('eslint-disable and .skip are caught', () =>
  assert.equal(
    check({ ...ok, added: { 'a.ts': ['// eslint-disable-next-line', "it.skip('x')"] } }).length,
    2,
  ))
