import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

const mockBalance = jest.fn<() => Promise<number>>()
const mockToday = jest.fn<() => Promise<number>>()
jest.mock('./use-paywall', () => ({ useShowPaywallAfterFirstReading: () => async () => {} }))
jest.mock('./use-auth-context', () => ({ useAuthContext: () => ({}), useUserId: () => 'u1' }))
jest.mock('../services/study', () => ({ markDayComplete: async () => {} }))
jest.mock('../services/reflections', () => ({ createReflection: async () => {} }))
jest.mock('../services/seeds', () => ({
  getSeedBalance: () => mockBalance(),
  getSeedsEarnedToday: () => mockToday(),
}))
jest.mock('../lib/supabase', () => ({ supabase: {} }))
jest.mock('../services/notifications', () => ({}))

import {
  useCreateReflection,
  useMarkDayComplete,
  useSeedBalance,
  useSeedsEarnedToday,
} from './queries'

function setup() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return { wrapper }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockBalance.mockResolvedValue(10)
  mockToday.mockResolvedValue(10)
})

describe('seed hooks', () => {
  it('expose balance and earned today', async () => {
    const { wrapper } = setup()
    const { result } = await renderHook(() => [useSeedBalance(), useSeedsEarnedToday()] as const, {
      wrapper,
    })
    await waitFor(() => expect(result.current[0].data).toBe(10))
    await waitFor(() => expect(result.current[1].data).toBe(10))
  })

  it('refetch after a day is marked complete', async () => {
    const { wrapper } = setup()
    const { result } = await renderHook(
      () => ({ s: useSeedBalance(), m: useMarkDayComplete('cs1') }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.s.data).toBe(10))
    mockBalance.mockResolvedValue(20)
    await act(async () => result.current.m.mutate(1))
    await waitFor(() => expect(result.current.s.data).toBe(20))
  })

  it('refetch after a reflection is created', async () => {
    const { wrapper } = setup()
    const { result } = await renderHook(
      () => ({ s: useSeedsEarnedToday(), r: useCreateReflection() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.s.data).toBe(10))
    mockToday.mockResolvedValue(15)
    await act(async () =>
      result.current.r.mutate({ circleId: 'c', body: 'hi', visibility: 'circle' }),
    )
    await waitFor(() => expect(result.current.s.data).toBe(15))
  })
})
