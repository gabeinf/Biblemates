import { describe, expect, it } from '@jest/globals'
import { weekGoal } from './week-goal'

// Local-time constructors so the tests hold in any timezone. 2026-11-23 is a Monday.
const at = (d: number, h = 12) => new Date(2026, 10, d, h).toISOString()
const now = (d: number, h = 9) => new Date(2026, 10, d, h)

describe('weekGoal', () => {
  it('runs Monday to Sunday and marks done, today, missed and future days', () => {
    const w = weekGoal([at(23), at(25)], 4, now(26))
    expect(w.days).toEqual(['done', 'missed', 'done', 'today', 'future', 'future', 'future'])
    expect(w.done).toBe(2)
  })

  it('is never behind on Monday, even with nothing done', () => {
    expect(weekGoal([], 7, now(23)).behind).toBe(false)
  })

  it('does not count today against you until it has passed', () => {
    expect(weekGoal([], 7, now(24)).behind).toBe(true) // Tuesday: yesterday was skipped
    expect(weekGoal([at(23)], 7, now(24)).behind).toBe(false)
  })

  it('is on track at the weekly pace and behind below it', () => {
    expect(weekGoal([at(23), at(24)], 3, now(26)).behind).toBe(false) // needs ceil(3*3/7) = 2
    expect(weekGoal([at(23)], 3, now(26)).behind).toBe(true)
  })

  it('treats Sunday as the last day of the week and Monday as the start of the next', () => {
    const sunday = weekGoal([at(23), at(29, 23)], 2, new Date(2026, 10, 29, 23, 59))
    expect(sunday.days[6]).toBe('done')
    expect(sunday.done).toBe(2)
    const nextMonday = weekGoal([at(29)], 2, new Date(2026, 10, 30, 0, 1))
    expect(nextMonday.done).toBe(0)
    expect(nextMonday.days[0]).toBe('today')
  })

  it('counts several completions on one day once', () => {
    expect(weekGoal([at(23, 8), at(23, 20)], 3, now(24)).done).toBe(1)
  })
})
