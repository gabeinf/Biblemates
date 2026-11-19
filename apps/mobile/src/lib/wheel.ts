/** Pure helpers for the snapping wheel picker (components/WheelPicker). */

/** Index of the row centred at scroll `offset`, clamped to the list. */
export function wheelIndex(offset: number, rowHeight: number, count: number): number {
  if (count <= 0) return 0
  const i = Math.round(offset / rowHeight)
  return Math.min(count - 1, Math.max(0, i))
}

/** "day" for 1 and "days" otherwise. */
export function daysSuffix(n: number): string {
  return n === 1 ? 'day' : 'days'
}

/** Weekly reading goal: 1–7 days, 3 by default. */
export const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const
export const DEFAULT_DAYS = 3
