import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { useShowPaywallAfterFirstReading } from './use-paywall'

const mockPush = jest.fn()
const mockLoad = jest.fn<() => Promise<unknown>>()
const mockSeen = jest.fn<() => boolean>()
const mockMark = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock('../lib/purchases', () => ({ loadOffer: () => mockLoad() }))
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
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSeen.mockReturnValue(false)
})

describe('useShowPaywallAfterFirstReading', () => {
  it('opens the paywall once and records it when an offering loads', async () => {
    mockLoad.mockResolvedValue({ packages: [{ identifier: 'a' }], introEligible: [] })
    await trigger()
    expect(mockMark).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/paywall')
  })

  it('does nothing when it was already shown', async () => {
    mockSeen.mockReturnValue(true)
    await trigger()
    expect(mockLoad).not.toHaveBeenCalled()
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
