import { describe, expect, it } from '@jest/globals'
import { STAKES_MAX, stakesFromLabel, stakesLabelError } from './stakes'

describe('stakesLabelError', () => {
  it('requires 1–40 characters after trimming', () => {
    expect(stakesLabelError('   ')).not.toBeNull()
    expect(stakesLabelError('Movie pick')).toBeNull()
    expect(stakesLabelError('x'.repeat(STAKES_MAX))).toBeNull()
    expect(stakesLabelError('x'.repeat(STAKES_MAX + 1))).not.toBeNull()
    expect(stakesLabelError(`  ${'x'.repeat(STAKES_MAX)}  `)).toBeNull()
  })
})

describe('stakesFromLabel', () => {
  it('makes a trimmed custom value', () => {
    expect(stakesFromLabel('  Movie pick ')).toEqual({ kind: 'custom', label: 'Movie pick' })
  })

  it('matches a preset typed exactly (any case)', () => {
    expect(stakesFromLabel('coffee on me')).toEqual({ kind: 'preset', label: 'Coffee on me' })
  })

  it('turns an edited preset into a custom value', () => {
    expect(stakesFromLabel('Coffee on me, large')).toEqual({
      kind: 'custom',
      label: 'Coffee on me, large',
    })
  })

  it('rejects invalid labels', () => {
    expect(stakesFromLabel('')).toBeNull()
  })
})
