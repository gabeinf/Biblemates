import { todayIso } from './study-day'

/** Local YYYY-MM-DD for an ISO timestamp (the user's own calendar, like `todayIso`). */
const dayOf = (iso: string) => todayIso(new Date(iso))

function shift(isoDay: string, delta: number) {
  const [y, m, d] = isoDay.split('-').map(Number)
  return todayIso(new Date(y, m - 1, d + delta))
}

/**
 * Consecutive days (ending today, or yesterday if today isn't read yet) with at least one completion.
 * Derived from `day_completions.completed_at`: nothing is stored.
 */
export function currentStreak(completedAt: readonly string[], today = todayIso()) {
  const days = new Set(completedAt.map(dayOf))
  let cursor = days.has(today) ? today : shift(today, -1)
  let n = 0
  while (days.has(cursor)) {
    n++
    cursor = shift(cursor, -1)
  }
  return n
}
