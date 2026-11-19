import { describe, expect, it } from '@jest/globals'
import type { PurchasesPackage } from 'react-native-purchases'
import { hasSeenPaywall, markPaywallSeen, planViews, trialOf } from './paywall'

const NOW = new Date(2026, 0, 10, 12)

function pkg(over: Record<string, unknown> = {}, id = '$rc_annual'): PurchasesPackage {
  return {
    identifier: id,
    product: {
      identifier: `${id}.product`,
      title: 'Plan',
      priceString: 'P-YEAR',
      price: 12,
      pricePerMonth: 1,
      pricePerMonthString: 'P-MONTH',
      subscriptionPeriod: 'P1Y',
      introPrice: null,
      ...over,
    },
  } as unknown as PurchasesPackage
}

const freeWeek = {
  price: 0,
  priceString: 'FREE',
  cycles: 1,
  period: 'P1W',
  periodUnit: 'DAY',
  periodNumberOfUnits: 7,
}

describe('planViews', () => {
  it('shows exactly what the store returned, with the monthly equivalent', () => {
    const [plan] = planViews([pkg()], NOW, [])
    expect(plan).toMatchObject({
      name: 'Yearly',
      price: 'P-YEAR',
      period: 'year',
      perMonth: 'P-MONTH',
    })
    expect(plan.badge).toBeNull()
    expect(plan.trial).toBeNull()
  })

  it('computes the savings badge from per-month prices, only with 2+ plans', () => {
    const month = pkg({ subscriptionPeriod: 'P1M', pricePerMonth: 4 }, '$rc_monthly')
    const [year, monthly] = planViews([pkg({ pricePerMonth: 3 }), month], NOW, [])
    expect(year.badge).toBe('Save 25%')
    expect(monthly.badge).toBeNull()
    expect(monthly.perMonth).toBeNull()
  })
})

describe('trialOf', () => {
  it('is null without an intro offer', () => {
    expect(trialOf(pkg().product, NOW)).toBeNull()
  })

  it('takes the length and billing date from the offer, counted from today', () => {
    const t = trialOf(pkg({ introPrice: freeWeek }).product, NOW)!
    expect(t.days).toBe(7)
    expect(t.billingDate).toEqual(new Date(2026, 0, 17, 12))
    expect(t.reminderDate).toEqual(new Date(2026, 0, 15, 12))
    // A different offer moves every date: nothing is fixed in the code.
    const longer = trialOf(
      pkg({ introPrice: { ...freeWeek, periodNumberOfUnits: 14 } }).product,
      NOW,
    )!
    expect(longer.days).toBe(14)
    expect(longer.billingDate).toEqual(new Date(2026, 0, 24, 12))
    const later = trialOf(pkg({ introPrice: freeWeek }).product, new Date(2026, 5, 1, 9))!
    expect(later.billingDate).toEqual(new Date(2026, 5, 8, 9))
  })

  it('handles week and month units', () => {
    const wk = trialOf(
      pkg({ introPrice: { ...freeWeek, periodUnit: 'WEEK', periodNumberOfUnits: 2 } }).product,
      NOW,
    )!
    expect(wk.days).toBe(14)
    const mo = trialOf(
      pkg({ introPrice: { ...freeWeek, periodUnit: 'MONTH', periodNumberOfUnits: 1 } }).product,
      NOW,
    )!
    expect(mo.billingDate).toEqual(new Date(2026, 1, 10, 12))
  })

  it('skips the reminder on very short trials and ignores paid intro offers', () => {
    const short = trialOf(
      pkg({ introPrice: { ...freeWeek, periodNumberOfUnits: 2 } }).product,
      NOW,
    )!
    expect(short.reminderDate).toBeNull()
    expect(trialOf(pkg({ introPrice: { ...freeWeek, price: 1 } }).product, NOW)).toBeNull()
  })
})

describe('planViews trial eligibility', () => {
  const withTrial = pkg({ introPrice: freeWeek })
  const id = '$rc_annual.product'

  it('shows the trial when the offer is present and the user is eligible', () => {
    const [plan] = planViews([withTrial], NOW, [id])
    expect(plan.trial?.days).toBe(7)
  })

  it('hides it when the user is not eligible (plain yearly plan)', () => {
    const [plan] = planViews([withTrial], NOW, [])
    expect(plan.trial).toBeNull()
    expect(plan.price).toBe('P-YEAR')
  })

  it('hides it when the product has no offer, even if eligible', () => {
    expect(planViews([pkg()], NOW, [id])[0].trial).toBeNull()
  })
})

describe('seen flag', () => {
  it('starts unset and sticks once marked', () => {
    const store = new Map<string, string>()
    // Jest has no localStorage; the app installs one from expo-sqlite.
    Object.assign(globalThis, {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
      },
    })
    expect(hasSeenPaywall()).toBe(false)
    markPaywallSeen()
    expect(hasSeenPaywall()).toBe(true)
  })
})
