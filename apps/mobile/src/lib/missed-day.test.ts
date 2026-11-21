import { describe, expect, it } from '@jest/globals'
import type { DayCompletion } from '../types/db'
import { slippedYesterday } from './missed-day'

const c = (user_id: string, day_number: number) => ({ user_id, day_number }) as DayCompletion

describe('slippedYesterday', () => {
  it('is false on day 1', () => {
    expect(slippedYesterday([], 'u1', 1)).toBe(false)
  })
  it('is true when yesterday and today are both unread', () => {
    expect(slippedYesterday([c('u1', 1)], 'u1', 3)).toBe(true)
  })
  it('is false when yesterday was read', () => {
    expect(slippedYesterday([c('u1', 2)], 'u1', 3)).toBe(false)
  })
  it('is false once today is read, and ignores other members', () => {
    expect(slippedYesterday([c('u1', 3)], 'u1', 3)).toBe(false)
    expect(slippedYesterday([c('u2', 2)], 'u1', 3)).toBe(true)
  })
})
