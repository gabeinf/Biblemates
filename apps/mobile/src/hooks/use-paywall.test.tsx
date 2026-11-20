import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { useShowPaywallAfterFirstReading } from './use-paywall'

const mockPush = jest.fn()
const mockLoad = jest.fn<() => Promise<unknown>>()
const mockSeen = jest.fn<() => boolean>()
const mockMark = jest.fn()
const mockRegister = jest.fn<(args: { placement: string }) => Promise<void>>()
type Callbacks = {
  onPresent?: () => void
  onSkip?: (reason?: { type: string }) => void
  onError?: () => void
}
let callbacks: Callbacks = {}
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('../lib/purchases', () => ({ loadOffer: () => mockLoad() }))
jest.mock('../lib/superwall', () => ({
  usePlacement: (cb: Callbacks) => {
    callbacks = cb
    return { registerPlacement: mockRegister }
  },
}))
jest.mock('../lib/paywall', () => ({
  hasSeenPaywall: () => mockSeen(),
  markPaywallSeen: () => mockMark(),
}))

async function trigger() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  const { result } = await renderHook(() => useShowPaywallAfterFirstReading(), { wrapper })
  await result.current()
  // The fallback sheet opens from a Superwall callback, fire-and-forget: let it settle.
  await new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSeen.mockReturnValue(false)
  // Default: Superwall has nothing to show for this placement.
  mockRegister.mockImplementation(async () => callbacks.onSkip?.())
})

describe('useShowPaywallAfterFirstReading', () => {
  it('registers the first_reading_completed placement', async () => {
    await trigger()
    expect(mockRegister).toHaveBeenCalledWith({ placement: 'first_reading_completed' })
  })

  it('leaves it to Superwall, and records it, when a Superwall paywall is presented', async () => {
    mockRegister.mockImplementation(async () => callbacks.onPresent?.())
    await trigger()
    expect(mockMark).toHaveBeenCalled()
    expect(mockLoad).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('falls back to our own sheet when Superwall errors', async () => {
    mockLoad.mockResolvedValue({ packages: [{ identifier: 'a' }], introEligible: [] })
    mockRegister.mockImplementation(async () => callbacks.onError?.())
    await trigger()
    expect(mockPush).toHaveBeenCalledWith('/paywall')
  })

  it('does not fall back to our sheet for a Superwall holdout', async () => {
    mockLoad.mockResolvedValue({ packages: [{ identifier: 'a' }], introEligible: [] })
    mockRegister.mockImplementation(async () => callbacks.onSkip?.({ type: 'Holdout' }))
    await trigger()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('never throws into the reading flow if registering fails', async () => {
    mockRegister.mockRejectedValue(new Error('boom'))
    await expect(trigger()).resolves.toBeUndefined()
  })

  it('opens the paywall once and records it when an offering loads', async () => {
    mockLoad.mockResolvedValue({ packages: [{ identifier: 'a' }], introEligible: [] })
    await trigger()
    expect(mockMark).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/paywall')
  })

  it('does nothing when it was already shown', async () => {
    mockSeen.mockReturnValue(true)
    await trigger()
    expect(mockRegister).not.toHaveBeenCalled()
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('stays silent, and shows it next time, when there is no offering or the SDK throws', async () => {
    mockLoad.mockResolvedValueOnce({ packages: [], introEligible: [] })
    await trigger()
    mockLoad.mockRejectedValueOnce(new Error('offline'))
    await trigger()
    expect(mockPush).not.toHaveBeenCalled()
    expect(mockMark).not.toHaveBeenCalled()
  })
})
