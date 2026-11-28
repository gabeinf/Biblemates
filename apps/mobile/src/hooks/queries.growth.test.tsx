import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react-native'
import type { ReactNode } from 'react'

const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    clear: () => store.clear(),
  },
})

const mockMark = jest.fn<(cs: string, day: number, species?: string) => Promise<void>>()
const mockUnlocked = jest.fn<() => Promise<string[]>>()
const mockUnlock = jest.fn<(s: string) => Promise<void>>()
jest.mock('./use-paywall', () => ({ useShowPaywallAfterFirstReading: () => async () => {} }))
jest.mock('./use-auth-context', () => ({ useAuthContext: () => ({}), useUserId: () => 'u1' }))
jest.mock('../services/study', () => ({
  markDayComplete: (cs: string, day: number, species?: string) => mockMark(cs, day, species),
}))
jest.mock('../services/growth', () => ({
  getUnlockedSpecies: () => mockUnlocked(),
  unlockSpecies: (s: string) => mockUnlock(s),
}))
jest.mock('../lib/supabase', () => ({ supabase: {} }))
jest.mock('../services/notifications', () => ({}))

import { useChosenSpecies, useMarkDayComplete, useUnlockedSpecies, useUnlockSpecies } from './queries'

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
  globalThis.localStorage?.clear()
  mockMark.mockResolvedValue(undefined)
  mockUnlock.mockResolvedValue(undefined)
  mockUnlocked.mockResolvedValue(['sprout'])
})

describe('species hooks', () => {
  it('useMarkDayComplete plants a sprout for a bare day and the given species otherwise', async () => {
    const { wrapper } = setup()
    const { result } = await renderHook(() => useMarkDayComplete('cs1'), { wrapper })
    await act(async () => result.current.mutate(1))
    await act(async () => result.current.mutate({ day: 2, species: 'oak' }))
    expect(mockMark).toHaveBeenNthCalledWith(1, 'cs1', 1, 'sprout')
    expect(mockMark).toHaveBeenNthCalledWith(2, 'cs1', 2, 'oak')
  })

  it('useUnlockSpecies unlocks and refetches the unlocked list', async () => {
    const { wrapper } = setup()
    const { result } = await renderHook(
      () => ({ u: useUnlockedSpecies(), m: useUnlockSpecies() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.u.data).toEqual(['sprout']))
    mockUnlocked.mockResolvedValue(['sprout', 'clover'])
    await act(async () => result.current.m.mutate('clover'))
    expect(mockUnlock).toHaveBeenCalledWith('clover')
    await waitFor(() => expect(result.current.u.data).toEqual(['sprout', 'clover']))
  })

  it('useChosenSpecies persists the pick', async () => {
    const { wrapper } = setup()
    const { result } = await renderHook(() => useChosenSpecies(), { wrapper })
    expect(result.current[0]).toBe('sprout')
    await act(async () => result.current[1]('tulip'))
    expect(result.current[0]).toBe('tulip')
    const again = await renderHook(() => useChosenSpecies(), { wrapper })
    expect(again.result.current[0]).toBe('tulip')
  })
})
