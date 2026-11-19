// Screen test for 15 · Invite your circle. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Share } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import type { OnboardingDraft } from '@biblemates/shared'
import InviteCircle, { makeCode, resetCodeForTests } from '../app/(auth)/onboarding/15'
import { clearDraft, getDraft, updateDraft } from '../lib/onboarding-draft'

const mockGoNext = jest.fn<(answers?: Partial<OnboardingDraft>) => void>()
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 15, goNext: mockGoNext, goBack: jest.fn() }),
}))
jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn(async () => true) }))

const shareSpy = jest.spyOn(Share, 'share')
const codeText = () => screen.getByLabelText(/^Invite code/).props.children as string

describe('15 · Invite your circle', () => {
  beforeEach(() => {
    clearDraft()
    resetCodeForTests()
    mockGoNext.mockClear()
    shareSpy.mockReset()
    shareSpy.mockResolvedValue({ action: Share.sharedAction, activityType: undefined })
    jest.mocked(Clipboard.setStringAsync).mockClear()
  })

  it('makes six-character codes that fit the draft schema', () => {
    for (const r of [() => 0, () => 0.5, () => 0.999]) expect(makeCode(r)).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('opens the share sheet on enter with the link and code, and records invitedAt', async () => {
    await render(<InviteCircle />)
    await waitFor(() => expect(getDraft().invitedAt).toBeDefined())
    expect(shareSpy).toHaveBeenCalledTimes(1)
    const message = shareSpy.mock.calls[0][0].message as string
    expect(message).toContain(`biblemates://join/${codeText()}`)
  })

  it('does not record invitedAt when the sheet is dismissed', async () => {
    shareSpy.mockResolvedValue({ action: Share.dismissedAction, activityType: undefined })
    await render(<InviteCircle />)
    await waitFor(() => expect(shareSpy).toHaveBeenCalled())
    expect(getDraft().invitedAt).toBeUndefined()
  })

  it('shows the code and lets Continue through when sharing fails', async () => {
    shareSpy.mockRejectedValue(new Error('no share sheet'))
    await render(<InviteCircle />)
    expect(codeText()).toMatch(/^[A-Z0-9]{6}$/)
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(mockGoNext).toHaveBeenCalledWith()
  })

  it('re-opens the sheet from "Share invite"', async () => {
    await render(<InviteCircle />)
    await fireEvent.press(screen.getByRole('button', { name: 'Share invite' }))
    expect(shareSpy).toHaveBeenCalledTimes(2)
  })

  it('copies the code and confirms', async () => {
    await render(<InviteCircle />)
    await fireEvent.press(screen.getByRole('button', { name: 'Copy code' }))
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(codeText())
    expect(await screen.findByText('Code copied to your clipboard.')).toBeTruthy()
  })

  it('does not re-open the sheet when coming back after sharing', async () => {
    updateDraft({ invitedAt: new Date().toISOString() })
    await render(<InviteCircle />)
    expect(shareSpy).not.toHaveBeenCalled()
  })
})
