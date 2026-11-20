// Screen test for J · Join with code. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import type { OnboardingDraft } from '@biblemates/shared'
import JoinWithCode from '../app/(auth)/onboarding/join'
import { clearDraft, updateDraft } from '../lib/onboarding-draft'

const mockGoNext = jest.fn<(answers?: Partial<OnboardingDraft>) => void>()
let mockParams: { code?: string } = {}
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 'join', goNext: mockGoNext, goBack: jest.fn() }),
}))
jest.mock('expo-router', () => ({ useLocalSearchParams: () => mockParams }))

const field = () => screen.getByLabelText('Invite code')
const joinButton = () => screen.getByRole('button', { name: 'Join circle' })

describe('J · Join with code', () => {
  beforeEach(() => {
    clearDraft()
    mockGoNext.mockClear()
    mockParams = {}
  })

  it('uppercases, caps at 6 and enables Join only for a full code', async () => {
    await render(<JoinWithCode />)
    expect(joinButton()).toBeDisabled()
    await fireEvent.changeText(field(), 'ab12c')
    expect(field()).toHaveDisplayValue('AB12C')
    expect(joinButton()).toBeDisabled()
    await fireEvent.changeText(field(), 'ab12cd9')
    expect(field()).toHaveDisplayValue('AB12CD')
    expect(joinButton()).toBeEnabled()
  })

  it('fills in just the code when an invite link is pasted', async () => {
    await render(<JoinWithCode />)
    await fireEvent.changeText(field(), 'biblemates://onboarding/join?code=f3a9c1')
    expect(field()).toHaveDisplayValue('F3A9C1')
  })

  it('shows an inline error for a short code and keeps Join disabled', async () => {
    await render(<JoinWithCode />)
    await fireEvent.changeText(field(), 'AB1')
    await fireEvent(field(), 'blur')
    expect(screen.getByText(/numbers 0–9 and letters A–F\./)).toBeTruthy()
    expect(joinButton()).toBeDisabled()
  })

  it('flags a letter past F right away (no real code has one)', async () => {
    await render(<JoinWithCode />)
    await fireEvent.changeText(field(), 'AB12CO')
    expect(screen.getByText(/numbers 0–9 and letters A–F\./)).toBeTruthy()
    expect(joinButton()).toBeDisabled()
  })

  it('says so when pasted text has no code', async () => {
    await render(<JoinWithCode />)
    await fireEvent.changeText(field(), 'AB12CD')
    await fireEvent.changeText(field(), 'see you at church on sunday')
    expect(screen.getByText(/couldn’t find a code/)).toBeTruthy()
    // The earlier code is still in the field, but Join waits until the paste is sorted out.
    expect(joinButton()).toBeDisabled()
  })

  it('prefills from the deep link ?code=', async () => {
    mockParams = { code: 'f3a9c1' }
    updateDraft({ inviteCode: 'AAAAAA' })
    await render(<JoinWithCode />)
    expect(field()).toHaveDisplayValue('F3A9C1')
  })

  it('saves the code and the join path, then moves on', async () => {
    await render(<JoinWithCode />)
    await fireEvent.changeText(field(), 'AB12CD')
    await fireEvent.press(joinButton())
    expect(mockGoNext).toHaveBeenCalledWith({ inviteCode: 'AB12CD', path: 'join' })
  })
})
