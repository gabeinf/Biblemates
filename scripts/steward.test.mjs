import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pick } from './steward.mjs'

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
