import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseIssue, parsePr, plan, render } from './queue.mjs'

const isShared = (p) => p === 'package.json' || p.startsWith('packages/shared')
const issue = (number, body, labels = []) => ({
  number,
  title: `t${number}`,
  body,
  labels: labels.map((name) => ({ name })),
})
const run = (issues, prs = [], over = {}) =>
  plan({ issues, prs, masterGreen: true, isShared, ...over })
const nums = (xs) => xs.map((i) => i.number)

test('parses files, deps and shared from an issue body', () => {
  const i = parseIssue(issue(5, 'Files: `apps/a/b.tsx` `package.json`\nBlocked by #2'), isShared)
  assert.deepEqual(i.files, ['apps/a/b.tsx', 'package.json'])
  assert.deepEqual(i.deps, [2])
  assert.ok(i.shared)
})
test('an issue with no files is "unknown" and runs alone', () => {
  const r = run([issue(1, 'Files: `a/x.ts`'), issue(2, 'no files here')])
  assert.deepEqual(nums(r.launch), [1])
  assert.match(r.wait[0].why, /overlaps #1/)
})
test('launches up to 3 non-overlapping issues, rest wait for a slot', () => {
  const r = run([1, 2, 3, 4].map((n) => issue(n, `\`a/f${n}.ts\``)))
  assert.deepEqual(nums(r.launch), [1, 2, 3])
  assert.match(r.wait[0].why, /slots busy/)
})
test('overlapping files, directory prefixes and open blockers wait', () => {
  const r = run([issue(1, '`a/b/c.ts`'), issue(2, '`a/b/**`'), issue(3, '`z/q.ts` Blocked by #1')])
  assert.deepEqual(nums(r.launch), [1])
  assert.deepEqual(
    r.wait.map((w) => w.why),
    ['overlaps #1', 'blocked by #1'],
  )
})
test('a closed blocker no longer blocks', () => {
  assert.deepEqual(nums(run([issue(3, '`z/q.ts` Blocked by #1')]).launch), [3])
})
test('shared-surface issues go one at a time, others still run', () => {
  const r = run([
    issue(1, '`packages/shared/a.ts`'),
    issue(2, '`package.json`'),
    issue(3, '`x/y.ts`'),
  ])
  assert.deepEqual(nums(r.launch), [1, 3])
  assert.match(r.wait[0].why, /one at a time/)
})
test('claimed and PR-backed issues hold files; landing PRs free the slot but not the files', () => {
  const issues = [issue(1, '`a/x.ts`', ['in-progress']), issue(2, '`b/y.ts`'), issue(3, '`b/y.ts`')]
  const landingPr = {
    body: 'Closes #2',
    isDraft: false,
    labels: [{ name: 'gate:pass' }],
    autoMergeRequest: {},
    statusCheckRollup: [{ conclusion: 'SUCCESS' }],
  }
  const r = run(issues, [landingPr])
  assert.deepEqual(nums(r.working), [1])
  assert.deepEqual(nums(r.landing), [2])
  assert.deepEqual(r.launch, [])
  assert.match(r.wait[0].why, /overlaps #2/)
})
test('a PR with a pending or red check is still working', () => {
  const pr = {
    body: 'Closes #1',
    labels: [{ name: 'gate:pass' }],
    autoMergeRequest: {},
    statusCheckRollup: [{ conclusion: null }],
  }
  assert.equal(parsePr(pr).landing, false)
})
test('nothing launches while master is unverified; needs-decision is held', () => {
  const r = run([issue(1, '`a/x.ts`'), issue(2, '`b/y.ts`', ['needs-decision'])], [], {
    masterGreen: false,
  })
  assert.deepEqual(r.launch, [])
  assert.deepEqual(nums(r.hold), [2])
  assert.match(r.wait[0].why, /master/)
})
test('reports DONE only when nothing is left', () => {
  assert.match(render(run([]), 'green'), /DONE/)
  assert.doesNotMatch(render(run([issue(1, '`a/x.ts`')]), 'green'), /DONE/)
})
