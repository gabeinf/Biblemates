import { describe, expect, it } from '@jest/globals'
import { firstName, greeting, initials, timeAgo } from './format'

describe('initials', () => {
  it('uses the first letter of the first two words', () => {
    expect(initials('ruth ann miller')).toBe('RA')
  })
  it('falls back to ? for empty input', () => {
    expect(initials('')).toBe('?')
    expect(initials(null)).toBe('?')
  })
})

describe('firstName', () => {
  it('returns the first word, or a fallback', () => {
    expect(firstName('  Lydia Grace ')).toBe('Lydia')
    expect(firstName(undefined)).toBe('Someone')
  })
})

describe('timeAgo', () => {
  const now = Date.parse('2026-01-10T12:00:00Z')
  it.each([
    ['2026-01-10T11:59:30Z', 'just now'],
    ['2026-01-10T11:59:00Z', '1 minute ago'],
    ['2026-01-10T09:00:00Z', '3h ago'],
    ['2026-01-09T11:00:00Z', 'yesterday'],
    ['2026-01-05T12:00:00Z', '5 days ago'],
  ])('%s → %s', (iso, expected) => {
    expect(timeAgo(iso, now)).toBe(expected)
  })
})

describe('greeting', () => {
  it('changes with the hour', () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe('Good morning')
    expect(greeting(new Date(2026, 0, 1, 14))).toBe('Good afternoon')
    expect(greeting(new Date(2026, 0, 1, 20))).toBe('Good evening')
  })
})
