// Screen test for 17 · Notifications. Lives outside app/ so expo-router doesn't treat it as a route.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Platform } from 'react-native'
import type { OnboardingDraft } from '@biblemates/shared'
import Notifications from '../app/(auth)/onboarding/17'
import { clearDraft, updateDraft } from '../lib/onboarding-draft'

const mockGoNext = jest.fn<(answers?: Partial<OnboardingDraft>) => void>()
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 17, goNext: mockGoNext, goBack: jest.fn() }),
}))

type Perm = { granted: boolean; status: string; canAskAgain: boolean }
const mockGet = jest.fn<() => Promise<Perm>>()
const mockRequest = jest.fn<() => Promise<Perm>>()
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: () => mockGet(),
  requestPermissionsAsync: () => mockRequest(),
}))

const perm = (granted: boolean, status: string, canAskAgain = true): Perm => ({
  granted,
  status,
  canAskAgain,
})
const setOS = (os: string) =>
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true })

describe('17 · Notifications', () => {
  beforeEach(() => {
    clearDraft()
    mockGoNext.mockClear()
    mockGet.mockReset()
    mockRequest.mockReset()
    setOS('ios')
  })
  afterEach(() => {
    setOS('ios')
  })

  it('asks once on enter and advances with "granted" on Allow', async () => {
    mockGet.mockResolvedValue(perm(false, 'undetermined'))
    mockRequest.mockResolvedValue(perm(true, 'granted'))
    await render(<Notifications />)
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledWith({ notifications: 'granted' }))
    expect(mockRequest).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()
  })

  it('advances with "denied" on Don’t Allow', async () => {
    mockGet.mockResolvedValue(perm(false, 'undetermined'))
    mockRequest.mockResolvedValue(perm(false, 'denied', false))
    await render(<Notifications />)
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledWith({ notifications: 'denied' }))
  })

  it('skips the prompt when already granted', async () => {
    mockGet.mockResolvedValue(perm(true, 'granted'))
    await render(<Notifications />)
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledWith({ notifications: 'granted' }))
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('skips the prompt when denied for good', async () => {
    mockGet.mockResolvedValue(perm(false, 'denied', false))
    await render(<Notifications />)
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledWith({ notifications: 'denied' }))
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('still asks when Android reports denied but can ask again', async () => {
    mockGet.mockResolvedValue(perm(false, 'denied', true))
    mockRequest.mockResolvedValue(perm(true, 'granted'))
    await render(<Notifications />)
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledWith({ notifications: 'granted' }))
    expect(mockRequest).toHaveBeenCalledTimes(1)
  })

  it('advances as "unavailable" when the module throws', async () => {
    mockGet.mockRejectedValue(new Error('no module'))
    await render(<Notifications />)
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledWith({ notifications: 'unavailable' }))
  })

  it('on web shows Continue, never prompts, and saves "unavailable"', async () => {
    setOS('web')
    await render(<Notifications />)
    expect(mockGet).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(mockGoNext).toHaveBeenCalledWith({ notifications: 'unavailable' })
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('shows Continue instead of asking again when coming back from 18', async () => {
    updateDraft({ notifications: 'denied' })
    await render(<Notifications />)
    expect(mockGet).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(mockGoNext).toHaveBeenCalledWith({})
  })
})
