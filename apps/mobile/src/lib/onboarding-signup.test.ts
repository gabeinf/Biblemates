import { describe, expect, it, jest } from '@jest/globals'
import { OnboardingDraftSchema } from '@biblemates/shared'
import { onboardingPayload, signInWithAppleToken, signUpErrorMessage } from './onboarding-signup'

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

describe('signInWithAppleToken', () => {
  const make = (rpcError: { message: string } | null) => ({
    auth: {
      signInWithIdToken: jest.fn(async () => ({ error: null })),
      signOut: jest.fn(async () => ({})),
    },
    rpc: jest.fn(async (_fn: string, _args: unknown) => ({ error: rpcError })),
  })

  it('applies the draft in one write after the session exists', async () => {
    const c = make(null)
    expect(await signInWithAppleToken(c, 'tok', draft)).toBeNull()
    expect(c.rpc).toHaveBeenCalledTimes(1)
    expect(c.rpc).toHaveBeenCalledWith('complete_onboarding', {
      answers: onboardingPayload(draft),
      display: null,
    })
    expect(c.auth.signOut).not.toHaveBeenCalled()
  })

  it('signs out and reports the error when the write fails', async () => {
    const c = make({ message: 'Database error' })
    expect(await signInWithAppleToken(c, 'tok', { ...draft, path: 'join' })).toMatch(/invite code/)
    expect(c.auth.signOut).toHaveBeenCalled()
  })
})
