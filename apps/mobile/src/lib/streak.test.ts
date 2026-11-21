import { describe, expect, it } from '@jest/globals'
import { currentStreak } from './streak'

const at = (day: string) => `${day}T12:00:00`

describe('currentStreak', () => {
  it('is 0 with no completions', () => {
    expect(currentStreak([], '2026-11-20')).toBe(0)
  })
  it('counts consecutive days ending today', () => {
    expect(currentStreak([at('2026-11-18'), at('2026-11-19'), at('2026-11-20')], '2026-11-20')).toBe(3)
  })
  it('stays alive until the day ends: yesterday still counts', () => {
    expect(currentStreak([at('2026-11-18'), at('2026-11-19')], '2026-11-20')).toBe(2)
  })
  it('breaks on a gap and ignores duplicates', () => {
    expect(currentStreak([at('2026-11-20'), at('2026-11-20'), at('2026-11-18')], '2026-11-20')).toBe(1)
    expect(currentStreak([at('2026-11-17')], '2026-11-20')).toBe(0)
  })
  it('crosses a month boundary', () => {
    expect(currentStreak([at('2026-10-31'), at('2026-11-01')], '2026-11-01')).toBe(2)
  })
})
