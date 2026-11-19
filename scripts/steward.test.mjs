import assert from 'node:assert/strict'
import { test } from 'node:test'
import { flakyRuns, pick } from './steward.mjs'

const pr = (number, over = {}) => ({
  number,
  isDraft: false,
  labels: [{ name: 'gate:pass' }],
  autoMergeRequest: { mergeMethod: 'SQUASH' },
  mergeStateStatus: 'BEHIND',
  createdAt: `2026-11-19T00:00:0${number}Z`,
  statusCheckRollup: [],
  ...over,
})

test('updates the oldest ready PR first', () => {
  const r = pick([pr(3), pr(1), pr(2)], false)
  assert.equal(r.action, 'update')
  assert.equal(r.pr.number, 1)
})
test('does nothing when master is red', () => assert.equal(pick([pr(1)], true).action, 'none'))
test('skips drafts, PRs without gate:pass or auto-merge', () => {
  const prs = [
    pr(1, { isDraft: true }),
    pr(2, { labels: [] }),
    pr(3, { autoMergeRequest: null }),
    pr(4),
  ]
  assert.equal(pick(prs, false).pr.number, 4)
  assert.equal(pick(prs.slice(0, 3), false).action, 'none')
})
test('one at a time: waits while another PR is current and re-verifying', () => {
  const r = pick([pr(1), pr(2, { mergeStateStatus: 'BLOCKED' })], false)
  assert.equal(r.action, 'none')
})
test('conflicting or failing PRs do not block the queue', () => {
  const prs = [
    pr(1, { mergeStateStatus: 'DIRTY' }),
    pr(2, { mergeStateStatus: 'BLOCKED', statusCheckRollup: [{ conclusion: 'FAILURE' }] }),
    pr(3),
  ]
  assert.equal(pick(prs, false).pr.number, 3)
})
test('a superseded CANCELLED run does not block a newer SUCCESS of the same check', () => {
  const statusCheckRollup = [
    { name: 'guidelines', conclusion: 'CANCELLED', startedAt: '2026-11-19T17:44:25Z' },
    { name: 'guidelines', conclusion: 'SUCCESS', startedAt: '2026-11-19T17:44:29Z' },
    { name: 'verify', conclusion: 'SUCCESS', startedAt: '2026-11-19T17:44:20Z' },
  ]
  assert.equal(pick([pr(1, { statusCheckRollup })], false).pr.number, 1)
  assert.equal(
    pick([pr(1, { statusCheckRollup: [...statusCheckRollup].reverse() })], false).action,
    'update',
  )
})
test('a newer FAILURE after an older SUCCESS still blocks the PR', () => {
  const statusCheckRollup = [
    { name: 'verify', conclusion: 'FAILURE', startedAt: '2026-11-19T17:44:29Z' },
    { name: 'verify', conclusion: 'SUCCESS', startedAt: '2026-11-19T17:44:25Z' },
  ]
  assert.equal(pick([pr(1, { statusCheckRollup })], false).action, 'none')
})
test('status contexts are keyed by context and fall back to completedAt', () => {
  const statusCheckRollup = [
    { context: 'ci/x', state: 'ERROR', completedAt: '2026-11-19T17:00:00Z' },
    { context: 'ci/x', state: 'SUCCESS', completedAt: '2026-11-19T18:00:00Z' },
  ]
  assert.equal(pick([pr(1, { statusCheckRollup })], false).action, 'update')
})

const url = (id, job = 9) => `https://github.com/o/r/actions/runs/${id}/job/${job}`
test('flakyRuns: latest CANCELLED/TIMED_OUT/STARTUP_FAILURE checks, deduped by run id', () => {
  const statusCheckRollup = [
    { name: 'verify', conclusion: 'CANCELLED', startedAt: '1', detailsUrl: url(11, 1) },
    { name: 'lint', conclusion: 'TIMED_OUT', startedAt: '1', detailsUrl: url(11, 2) },
    { name: 'guidelines', conclusion: 'STARTUP_FAILURE', startedAt: '1', detailsUrl: url(22) },
  ]
  assert.deepEqual(flakyRuns(pr(1, { statusCheckRollup })), ['11', '22'])
})
test('flakyRuns ignores real failures, superseded runs and contexts without a run id', () => {
  const statusCheckRollup = [
    { name: 'verify', conclusion: 'FAILURE', startedAt: '1', detailsUrl: url(11) },
    { name: 'guidelines', conclusion: 'CANCELLED', startedAt: '1', detailsUrl: url(22) },
    { name: 'guidelines', conclusion: 'SUCCESS', startedAt: '2', detailsUrl: url(23) },
    { context: 'ci/x', state: 'ERROR', completedAt: '1', detailsUrl: 'https://example.com' },
    { name: 'noUrl', conclusion: 'CANCELLED', startedAt: '1' },
  ]
  assert.deepEqual(flakyRuns(pr(1, { statusCheckRollup })), [])
})
