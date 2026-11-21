// Hook test: only a `milestone` activity row should trigger the celebration callback.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-native'
import type { ReactNode } from 'react'
import { useCircleRealtime } from '../hooks/queries'

jest.mock('../hooks/use-paywall', () => ({}))
jest.mock('../services/notifications', () => ({}))
let mockInsert: (payload: { new: { kind: string } }) => void = () => {}
jest.mock('../lib/supabase', () => {
  const channel = {
    on: (_type: unknown, _filter: unknown, cb: typeof mockInsert) => {
      mockInsert = cb
      return channel
    },
    subscribe: () => channel,
  }
  return { supabase: { channel: () => channel, removeChannel: jest.fn() } }
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

describe('useCircleRealtime', () => {
  beforeEach(() => {
    mockInsert = () => {}
  })

  it('calls onMilestone for a milestone row only', async () => {
    const onMilestone = jest.fn()
    await renderHook(() => useCircleRealtime('c1', onMilestone), { wrapper })
    mockInsert({ new: { kind: 'completed_reading' } })
    expect(onMilestone).not.toHaveBeenCalled()
    mockInsert({ new: { kind: 'milestone' } })
    expect(onMilestone).toHaveBeenCalledTimes(1)
  })
})
