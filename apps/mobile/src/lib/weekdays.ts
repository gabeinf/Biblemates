/**
 * Weekday initials, Monday first. Locale-aware where `Intl` is available, with a single
 * English fallback so every screen draws the same week.
 */

/** The one fallback week, used when `Intl` can't name the days. */
export const WEEKDAY_NAMES_FALLBACK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const
export const WEEKDAY_INITIALS_FALLBACK = WEEKDAY_NAMES_FALLBACK.map((d) => d[0])

// 2024-01-01 was a Monday, so these seven dates run Monday → Sunday.
const MONDAY_UTC = Date.UTC(2024, 0, 1)
const DAY_MS = 86_400_000

function weekday(locale: string | undefined, style: 'narrow' | 'long'): string[] | null {
  try {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' })
    const days = Array.from({ length: 7 }, (_, i) => fmt.format(new Date(MONDAY_UTC + i * DAY_MS)))
    return days.every((d) => d.length > 0) ? days : null
  } catch {
    return null
  }
}

/** One short label per day, Monday first ("M", "T", …). */
export function weekdayInitials(locale?: string): readonly string[] {
  return weekday(locale, 'narrow') ?? WEEKDAY_INITIALS_FALLBACK
}

/** Full day names, Monday first, for screen-reader labels. */
export function weekdayNames(locale?: string): readonly string[] {
  return weekday(locale, 'long') ?? WEEKDAY_NAMES_FALLBACK
}
