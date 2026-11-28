import type { DayState } from '../components/ui'
import { todayIso } from './study-day'

export type WeekGoal = {
  /** Mon→Sun, in the device's own calendar (same local-date rule as `todayIso`). */
  days: DayState[]
  done: number
  goal: number
  behind: boolean
}

/** Monday of `now`'s week as a local calendar day, offset by `i` days. */
function weekDays(now: Date) {
  const sinceMonday = (now.getDay() + 6) % 7
  return {
    sinceMonday,
    iso: Array.from({ length: 7 }, (_, i) =>
      todayIso(new Date(now.getFullYear(), now.getMonth(), now.getDate() - sinceMonday + i)),
    ),
  }
}

/**
 * This week's done days against the weekly goal. `behind` = fewer done days than the pace
 * the goal needs by the end of yesterday, so Monday is never behind and today is never counted against you.
 * shortcut: completions are matched by local calendar day, so a DST shift can't move a day but travel across timezones can.
 */
export function weekGoal(completedAt: readonly string[], goal: number, now = new Date()): WeekGoal {
  const { sinceMonday, iso } = weekDays(now)
  const doneDays = new Set(completedAt.map((c) => todayIso(new Date(c))))
  const days = iso.map<DayState>((d, i) =>
    doneDays.has(d) ? 'done' : i === sinceMonday ? 'today' : i < sinceMonday ? 'missed' : 'future',
  )
  const done = days.filter((d) => d === 'done').length
  return { days, done, goal, behind: done < Math.ceil((goal * sinceMonday) / 7) }
}
