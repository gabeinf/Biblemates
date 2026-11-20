import { describe, expect, it } from '@jest/globals'
import { extractInviteCode, hasNonHex, isInviteCode, sanitizeCode } from './invite-code'

describe('sanitizeCode', () => {
  it('uppercases, drops other characters and caps at 6', () => {
    expect(sanitizeCode('ab12')).toBe('AB12')
    expect(sanitizeCode('ab-12 cd')).toBe('AB12CD')
    expect(sanitizeCode('ab12cd99')).toBe('AB12CD')
  })
})

describe('extractInviteCode', () => {
  it('keeps a typed or pasted bare code', () => {
    expect(extractInviteCode(' f3a9c1 ')).toBe('F3A9C1')
  })

  it('pulls the code from an invite link', () => {
    expect(extractInviteCode('biblemates://onboarding/join?code=f3a9c1')).toBe('F3A9C1')
    expect(extractInviteCode('https://example.com/onboarding/join?ref=x&code=AB12CD')).toBe(
      'AB12CD',
    )
  })

  it('pulls the code from a shared message, not the first 6-letter word', () => {
    expect(
      extractInviteCode(
        'Join my Bible reading circle "Fridays" on Biblemates! Use invite code 7BC2E0.',
      ),
    ).toBe('7BC2E0')
  })

  it('finds a standalone uppercase code in a message', () => {
    expect(extractInviteCode('My code is 7BC2E0, see you Friday')).toBe('7BC2E0')
  })

  it('keeps non-hex letters so the field can flag them', () => {
    expect(sanitizeCode('ab12co')).toBe('AB12CO')
  })

  it('finds nothing in a link or sentence without a valid code', () => {
    expect(extractInviteCode('x://join?code=ABCDEFG')).toBeNull()
    expect(extractInviteCode('hello there friends')).toBeNull()
  })

  it('stops at 6 when typing past the end', () => {
    expect(extractInviteCode('AB12CD7')).toBe('AB12CD')
  })
})

describe('isInviteCode', () => {
  it('accepts exactly 6 uppercase hex characters, like the database makes', () => {
    expect(isInviteCode('AB12CD')).toBe(true)
    expect(isInviteCode('AB12C')).toBe(false)
    expect(isInviteCode('ab12cd')).toBe(false)
    expect(isInviteCode('ZZZZZZ')).toBe(false)
    expect(isInviteCode('AB12CO')).toBe(false)
  })
})

describe('hasNonHex', () => {
  it('flags letters past F', () => {
    expect(hasNonHex('AB1')).toBe(false)
    expect(hasNonHex('AB1G')).toBe(true)
  })
})
