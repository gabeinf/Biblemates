import type { DayCompletion } from '../types/db'
import { isDayDone } from './study-day'

/**
 * True when yesterday's reading is still open for this member and today's isn't read yet.
 * Presentation only: derived from existing completions, nothing is stored or penalised.
 */
export function slippedYesterday(completions: DayCompletion[], userId: string, dayNumber: number) {
  return dayNumber > 1 && !isDayDone(completions, userId, dayNumber - 1) && !isDayDone(completions, userId, dayNumber)
}
