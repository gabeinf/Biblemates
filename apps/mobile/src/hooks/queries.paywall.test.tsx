import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

const mockShow = jest.fn<() => Promise<void>>()
const mockMark = jest.fn<(id: string, day: number) => Promise<void>>()
jest.mock('./use-paywall', () => ({ useShowPaywallAfterFirstReading: () => mockShow }))
jest.mock('./use-auth-context', () => ({ useAuthContext: () => ({}), useUserId: () => 'u1' }))
jest.mock('../services/study', () => ({
  markDayComplete: (id: string, d: number) => mockMark(id, d),
}))
jest.mock('../lib/supabase', () => ({ supabase: {} }))
jest.mock('../services/notifications', () => ({}))

import { useMarkDayComplete } from './queries'

function run() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  )
  return renderHook(() => useMarkDayComplete('cs1'), { wrapper })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockShow.mockResolvedValue()
})

describe('useMarkDayComplete (the app\'s "completed reading")', () => {
  it('offers the one-time paywall after a day is marked as read', async () => {
    mockMark.mockResolvedValue()
    const { result } = await run()
    await act(async () => result.current.mutate(3))
    await waitFor(() => expect(mockShow).toHaveBeenCalledTimes(1))
    expect(mockMark).toHaveBeenCalledWith('cs1', 3)
  })

  it('does not offer it when marking the day fails', async () => {
    mockMark.mockRejectedValue(new Error('offline'))
    const { result } = await run()
    await act(async () => result.current.mutate(3))
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockShow).not.toHaveBeenCalled()
  })
})
