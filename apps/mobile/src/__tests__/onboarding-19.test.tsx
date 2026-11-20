// Screen test for 19 · Save progress. Lives outside app/ so expo-router does not bundle it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { getDraft, resetDraftCacheForTests, updateDraft } from '../lib/onboarding-draft'
import SaveProgress from '../app/(auth)/onboarding/19'

const mockIdToken = jest.fn<(a: any) => Promise<any>>()
const mockRpc = jest.fn<(fn: string, a: any) => Promise<any>>()
const mockApple = jest.fn<() => Promise<any>>()
const mockSignUp = jest.fn<(args: any) => Promise<any>>()
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: { signUp: (a: any) => mockSignUp(a), setSession: jest.fn(async () => ({ error: null })) },
  },
  createScratchClient: () => ({
    auth: { signInWithIdToken: (a: any) => mockIdToken(a), signOut: jest.fn() },
    rpc: (fn: string, a: any) => mockRpc(fn, a),
  }),
}))
jest.mock('expo-apple-authentication', () => ({
  AppleAuthenticationScope: { EMAIL: 1 },
  signInAsync: () => mockApple(),
}))
const mockPlacement = jest.fn<(a: any) => Promise<void>>()
jest.mock('../lib/superwall', () => ({
  usePlacement: () => ({ registerPlacement: (a: any) => mockPlacement(a) }),
}))
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }))

const fillEmail = async (email = 'a@b.co', password = 'secret1') => {
  await fireEvent.press(screen.getByText('Continue with email'))
  await fireEvent.changeText(screen.getByLabelText('Email'), email)
  await fireEvent.changeText(screen.getByLabelText('Password'), password)
}

beforeEach(() => {
  resetDraftCacheForTests()
  mockSignUp.mockReset()
  mockIdToken
    .mockReset()
    .mockResolvedValue({
      data: { session: { access_token: 'a', refresh_token: 'r' } },
      error: null,
    })
  mockRpc.mockReset().mockResolvedValue({ error: null })
  mockApple.mockReset().mockResolvedValue({ identityToken: 'tok' })
  mockPlacement.mockReset().mockResolvedValue()
})

describe('19 · Save progress', () => {
  it('shows Apple and keeps Google hidden until it is configured', async () => {
    await render(<SaveProgress />)
    expect(screen.getByText('Continue with Apple')).toBeTruthy()
    expect(screen.queryByText('Continue with Google')).toBeNull()
  })

  it('Apple: signs in, then applies and clears the draft', async () => {
    updateDraft({ path: 'create', daysPerWeek: 4 })
    await render(<SaveProgress />)
    await fireEvent.press(screen.getByText('Continue with Apple'))
    await waitFor(() => expect(mockRpc).toHaveBeenCalledTimes(1))
    expect(mockIdToken).toHaveBeenCalledWith({ provider: 'apple', token: 'tok' })
    expect(mockRpc.mock.calls[0][0]).toBe('complete_onboarding')
    await waitFor(() => expect(getDraft().daysPerWeek).not.toBe(4))
  })

  it('Apple: a failed write keeps the draft and shows the error', async () => {
    updateDraft({ path: 'create', daysPerWeek: 4 })
    mockRpc.mockResolvedValue({ error: { message: 'boom' } })
    await render(<SaveProgress />)
    await fireEvent.press(screen.getByText('Continue with Apple'))
    expect(await screen.findByText('boom')).toBeTruthy()
    expect(getDraft().daysPerWeek).toBe(4)
  })

  it('signs up with the draft in one call, then clears the draft', async () => {
    updateDraft({
      path: 'create',
      displayName: 'Ruth',
      daysPerWeek: 4,
      stakes: { kind: 'preset', label: 'Coffee' },
    })
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    await render(<SaveProgress />)
    await fillEmail()
    await fireEvent.press(screen.getByText('Create account'))

    await waitFor(() => expect(mockSignUp).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(mockPlacement).toHaveBeenCalledWith({ placement: 'onboarding_completed' }),
    )
    expect(mockSignUp.mock.calls[0][0]).toEqual({
      email: 'a@b.co',
      password: 'secret1',
      options: {
        data: {
          display_name: 'Ruth',
          onboarding: {
            path: 'create',
            daysPerWeek: 4,
            stakes: { kind: 'preset', label: 'Coffee' },
          },
        },
      },
    })
    await waitFor(() => expect(getDraft()).toEqual({}))
    expect(screen.getByText('Check your inbox.')).toBeTruthy()
  })

  it('stays on the screen with the error, and keeps the draft, when sign-up fails', async () => {
    updateDraft({ path: 'create', displayName: 'Ruth' })
    mockSignUp.mockResolvedValue({ data: {}, error: { message: 'User already registered' } })
    await render(<SaveProgress />)
    await fillEmail()
    await fireEvent.press(screen.getByText('Create account'))

    expect(await screen.findByText('User already registered')).toBeTruthy()
    expect(getDraft().displayName).toBe('Ruth')
  })

  it('validates email and password before calling Supabase', async () => {
    await render(<SaveProgress />)
    await fillEmail('nope', '123')
    await fireEvent.press(screen.getByText('Create account'))
    expect(await screen.findByText('Enter a valid email address.')).toBeTruthy()
    expect(screen.getByText('Use at least 6 characters.')).toBeTruthy()
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('joins with a code entered here when none was entered earlier', async () => {
    updateDraft({ path: 'create', daysPerWeek: 3 })
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    await render(<SaveProgress />)
    await fireEvent.press(screen.getByLabelText('Have an invite code?'))
    await fireEvent.changeText(screen.getByLabelText('Invite code'), 'abc123')
    await fillEmail()
    await fireEvent.press(screen.getByText('Create account'))

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled())
    expect(mockSignUp.mock.calls[0][0].options.data.onboarding).toEqual({
      path: 'join',
      inviteCode: 'ABC123',
    })
  })

  it('signs up with an empty draft (deep link): no circle answers, circle setup follows', async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    await render(<SaveProgress />)
    await fillEmail()
    await fireEvent.press(screen.getByText('Create account'))

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled())
    expect(mockSignUp.mock.calls[0][0].options.data).toEqual({ onboarding: {} })
  })

  it('hides the invite chip when a code was entered earlier', async () => {
    updateDraft({ path: 'join', inviteCode: 'ABC123' })
    await render(<SaveProgress />)
    expect(screen.queryByLabelText('Have an invite code?')).toBeNull()
  })
})
