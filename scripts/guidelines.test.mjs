import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { check, findOverlap, sharedMatcher } from './guidelines.mjs'

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

const shared = sharedMatcher(
  readFileSync(new URL('../.claude/skills/clear-issues/SKILL.md', import.meta.url), 'utf8'),
)
test('shared surface is read from the clear-issues skill', () => {
  for (const p of [
    'package.json',
    'pnpm-lock.yaml',
    'packages/shared/src/a/b.ts',
    'apps/mobile/src/app/(auth)/onboarding/_layout.tsx',
    'apps/mobile/src/theme/tokens.ts',
  ])
    assert.ok(shared(p), p)
  for (const p of ['apps/mobile/src/app/(auth)/onboarding/5.tsx', 'apps/mobile/package.json'])
    assert.ok(!shared(p), p)
  assert.throws(() => sharedMatcher('# nothing'))
})
test('disjoint PRs are unaffected', () =>
  assert.deepEqual(
    findOverlap({ number: 5, files: ['a'] }, [{ number: 2, files: ['b'] }], shared),
    {
      overlaps: [],
      fails: [],
    },
  ))
test('plain overlap is reported but never fails', () => {
  const r = findOverlap(
    { number: 5, files: ['a', 'b'] },
    [{ number: 2, files: ['b', 'c'] }],
    shared,
  )
  assert.deepEqual(r, { overlaps: [{ number: 2, files: ['b'] }], fails: [] })
})
test('shared-surface overlap fails unless this PR is the oldest', () => {
  const files = ['package.json', 'x.ts']
  const others = [
    { number: 2, files: ['package.json'] },
    { number: 9, files: ['package.json'] },
  ]
  assert.equal(findOverlap({ number: 5, files }, others, shared).fails.length, 1) // #2 is older
  assert.deepEqual(findOverlap({ number: 1, files }, others, shared).fails, []) // oldest wins
  assert.deepEqual(findOverlap({ number: 5, files }, [{ number: 5, files }], shared).overlaps, [])
})

test('every failure line names its remedy, with the PR number filled in', () => {
  const bad = {
    ...ok,
    pr: '7',
    branch: 'wip',
    body: 'nothing\n- [ ] x ❌',
    files: [{ path: 'apps/mobile/src/lib/a.ts', add: 4, del: 0 }],
    newDeps: ['left-pad'],
    suppressionsDelta: 1,
    added: { 'a.ts': ['// eslint-disable-next-line', "it.skip('x')"] },
  }
  const fails = check(bad)
  assert.equal(fails.length, 9)
  for (const f of fails) assert.match(f, / \| fix: /, f)
  assert.ok(
    fails.some((f) => f.includes('gh issue create') && f.includes('gh pr edit 7 --body-file')),
  )
})
test('overlap failure tells how to proceed', () => {
  const { fails } = findOverlap(
    { number: 5, files: ['package.json'] },
    [{ number: 2, files: ['package.json'] }],
    shared,
  )
  assert.match(fails[0], / \| fix: .*gh pr update-branch/)
})
