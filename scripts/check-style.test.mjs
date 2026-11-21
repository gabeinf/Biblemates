import assert from 'node:assert/strict'
import { test } from 'node:test'
import { violations } from './check-style.mjs'

test('flags hex, rgba() and fontFamily strings', () => {
  const text = ["const a = { color: '#fff' }", 'const b = `rgba(0,0,0,.5)`', "const c = { fontFamily: 'Menlo' }"].join('\n')
  assert.equal(violations('x.tsx', text).length, 3)
})

test('ignores issue refs, tokens and theme calls', () => {
  const text = ['// TODO(#101)', 'const a = { fontFamily: typography.fontFamily.body, color: theme.text }'].join('\n')
  assert.deepEqual(violations('x.tsx', text), [])
})
