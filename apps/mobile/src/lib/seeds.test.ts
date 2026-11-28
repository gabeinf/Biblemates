import { describe, expect, it } from '@jest/globals'
import { SEEDS_PER_DAY, SEEDS_PER_REFLECTION, startOfTodayIso, sumSeeds } from './seeds'

describe('seeds', () => {
  it('uses the agreed defaults', () => {
    expect(SEEDS_PER_DAY).toBe(10)
    expect(SEEDS_PER_REFLECTION).toBe(5)
  })

  it('sums ledger rows, 0 when empty', () => {
    expect(sumSeeds([])).toBe(0)
    expect(sumSeeds([{ amount: 10 }, { amount: 5 }])).toBe(15)
  })

  it('starts today at local midnight', () => {
    const d = new Date(startOfTodayIso(new Date(2026, 10, 28, 15, 30)))
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([
      2026, 10, 28, 0, 0,
    ])
  })
})
