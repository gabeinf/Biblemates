// Screen test for 16 · Rating ask. Lives outside app/ so expo-router doesn't treat it as a route.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { Platform } from 'react-native'
import RatingAsk from '../app/(auth)/onboarding/16'

const mockGoNext = jest.fn()
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 16, goNext: mockGoNext, goBack: jest.fn() }),
}))

const mockAvailable = jest.fn<() => Promise<boolean>>()
const mockRequest = jest.fn<() => Promise<void>>()
jest.mock('expo-store-review', () => ({
  isAvailableAsync: () => mockAvailable(),
  requestReview: () => mockRequest(),
}))

const setOS = (os: string) =>
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true })
const press = () => fireEvent.press(screen.getByRole('button', { name: 'Continue' }))

describe('16 · Rating ask', () => {
  let store: Map<string, string>
  beforeEach(() => {
    store = new Map()
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
      },
    })
    mockGoNext.mockClear()
    mockAvailable.mockReset().mockResolvedValue(true)
    mockRequest.mockReset().mockResolvedValue(undefined)
    setOS('ios')
  })
  afterEach(() => {
    setOS('ios')
  })

  it('requests the native review on Continue, then advances', async () => {
    await render(<RatingAsk />)
    await press()
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledTimes(1))
    expect(mockRequest).toHaveBeenCalledTimes(1)
  })

  it('asks at most once per install, but still advances every time', async () => {
    await render(<RatingAsk />)
    await press()
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledTimes(1))
    await press()
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledTimes(2))
    expect(mockRequest).toHaveBeenCalledTimes(1)
  })

  it('skips the prompt on web and still advances', async () => {
    setOS('web')
    await render(<RatingAsk />)
    await press()
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledTimes(1))
    expect(mockAvailable).not.toHaveBeenCalled()
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('skips the prompt when the platform cannot show it', async () => {
    mockAvailable.mockResolvedValue(false)
    await render(<RatingAsk />)
    await press()
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledTimes(1))
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('advances even when the review module throws', async () => {
    mockRequest.mockRejectedValue(new Error('boom'))
    await render(<RatingAsk />)
    await press()
    await waitFor(() => expect(mockGoNext).toHaveBeenCalledTimes(1))
  })
})
