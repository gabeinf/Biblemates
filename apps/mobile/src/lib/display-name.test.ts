import { describe, expect, it } from '@jest/globals'
import { DISPLAY_NAME_MAX, cleanDisplayName } from './display-name'

describe('cleanDisplayName', () => {
  it('trims and collapses spaces', () => {
    expect(cleanDisplayName('  Mary   Jo ')).toBe('Mary Jo')
  })

  it('rejects empty or whitespace-only names', () => {
    expect(cleanDisplayName('')).toBeNull()
    expect(cleanDisplayName('   ')).toBeNull()
  })

  it('allows up to 30 characters', () => {
    expect(cleanDisplayName('x'.repeat(DISPLAY_NAME_MAX))).toBe('x'.repeat(DISPLAY_NAME_MAX))
    expect(cleanDisplayName('x'.repeat(DISPLAY_NAME_MAX + 1))).toBeNull()
  })
})
