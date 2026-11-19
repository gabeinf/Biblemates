import { describe, expect, it } from '@jest/globals'
import { OnboardingDraftSchema } from '@biblemates/shared'
import { onboardingPayload, signUpErrorMessage } from './onboarding-signup'

const draft = OnboardingDraftSchema.parse({
  path: 'create',
  intent: 'peace',
  daysPerWeek: 5,
  stakes: { kind: 'preset', label: 'Coffee' },
  inviteCode: 'ABC123',
  source: { id: 'friend' },
})

describe('onboardingPayload', () => {
  it('sends goal and stakes when creating a circle', () => {
    expect(onboardingPayload(draft)).toEqual({
      path: 'create',
      daysPerWeek: 5,
      stakes: { kind: 'preset', label: 'Coffee' },
      intent: 'peace',
      source: { id: 'friend' },
    })
  })

  it('sends the invite code, not goal or stakes, when joining', () => {
    expect(onboardingPayload({ ...draft, path: 'join' })).toEqual({
      path: 'join',
      inviteCode: 'ABC123',
      intent: 'peace',
      source: { id: 'friend' },
    })
  })
})

describe('signUpErrorMessage', () => {
  it('explains a rejected invite code when joining', () => {
    expect(signUpErrorMessage('Database error saving new user', true)).toMatch(/invite code/)
  })

  it('passes other errors through', () => {
    expect(signUpErrorMessage('Database error saving new user', false)).toBe(
      'Database error saving new user',
    )
    expect(signUpErrorMessage('User already registered', true)).toBe('User already registered')
  })
})
