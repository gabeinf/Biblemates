/**
 * Paywall view-model. Everything shown comes from the store product (RevenueCat package):
 * price strings, period, intro offer. Nothing here knows a price or a trial length.
 * Placement: shown once, after the user's first completed reading (see use-paywall.ts).
 */
import type { PurchasesPackage, PurchasesStoreProduct } from 'react-native-purchases'

const SEEN_KEY = 'paywall:shown'
const DAY_MS = 86_400_000

export type Trial = {
  days: number
  billingDate: Date
  /** Two days before billing; null when the trial is too short for a reminder. */
  reminderDate: Date | null
}

export type PlanView = {
  id: string
  name: string
  price: string
  /** "year", "month"... from the store's ISO period; null when unknown. */
  period: string | null
  /** Store-formatted monthly equivalent; null for monthly plans or when unavailable. */
  perMonth: string | null
  /** "Save N%" computed against the priciest plan per month; null with a single plan. */
  badge: string | null
  trial: Trial | null
}

const PERIOD_WORD: Record<string, string> = { Y: 'year', M: 'month', W: 'week', D: 'day' }
const PLAN_NAME: Record<string, string> = {
  year: 'Yearly',
  month: 'Monthly',
  week: 'Weekly',
  day: 'Daily',
}

/** "P1Y" → "year". Multi-unit periods ("P3M") aren't named: the price alone is shown. */
export function periodWord(iso: string | null): string | null {
  const m = iso?.match(/^P1([YMWD])$/)
  return m ? PERIOD_WORD[m[1]] : null
}

function addUnits(from: Date, unit: string, n: number): Date {
  const d = new Date(from)
  if (unit === 'DAY') d.setDate(d.getDate() + n)
  else if (unit === 'WEEK') d.setDate(d.getDate() + 7 * n)
  else if (unit === 'MONTH') d.setMonth(d.getMonth() + n)
  else if (unit === 'YEAR') d.setFullYear(d.getFullYear() + n)
  return d
}

/** Free-trial intro offer from the product, with dates counted from `now`. Paid intros are ignored. */
export function trialOf(product: PurchasesStoreProduct, now: Date): Trial | null {
  const intro = product.introPrice
  if (!intro || intro.price !== 0) return null
  const billingDate = addUnits(now, intro.periodUnit, intro.periodNumberOfUnits * intro.cycles)
  const days = Math.round((billingDate.getTime() - now.getTime()) / DAY_MS)
  return {
    days,
    billingDate,
    reminderDate: days > 2 ? new Date(billingDate.getTime() - 2 * DAY_MS) : null,
  }
}

/** Plans for the sheet. `introEligible` lists product ids eligible for their intro offer. `badge` compares each plan's per-month price with the priciest one. */
export function planViews(
  packages: PurchasesPackage[],
  now: Date,
  introEligible: string[],
): PlanView[] {
  const monthly = packages.map((p) => p.product.pricePerMonth)
  const top = Math.max(...monthly.map((m) => m ?? 0))
  return packages.map((p, i) => {
    const period = periodWord(p.product.subscriptionPeriod)
    const save = monthly[i] != null && top > 0 ? Math.round((1 - monthly[i]! / top) * 100) : 0
    return {
      id: p.identifier,
      name: period ? PLAN_NAME[period] : p.product.title,
      price: p.product.priceString,
      period,
      perMonth: period && period !== 'month' ? p.product.pricePerMonthString : null,
      badge: save > 0 ? `Save ${save}%` : null,
      // Only people the store says are new to the intro offer get trial wording.
      trial: introEligible.includes(p.product.identifier) ? trialOf(p.product, now) : null,
    }
  })
}

/** "Jan 5": the store's own locale, no hard-coded format. */
export function shortDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function hasSeenPaywall(): boolean {
  try {
    return globalThis.localStorage?.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export function markPaywallSeen() {
  try {
    globalThis.localStorage?.setItem(SEEN_KEY, '1')
  } catch {
    // Best effort: worst case the sheet is offered again after a later reading.
  }
}
