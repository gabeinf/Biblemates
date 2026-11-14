import type { CircleStudy, DayCompletion, StudyDay } from '../types/db';

/** Local calendar date as YYYY-MM-DD. */
export function todayIso(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(fromIso: string, toIso: string) {
  return Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86_400_000);
}

/** 1-based day of the study for today, clamped to the study length. */
export function currentDayNumber(cs: CircleStudy, today = todayIso()) {
  const n = daysBetween(cs.started_on, today) + 1;
  return Math.min(Math.max(n, 1), cs.study.total_days);
}

export function currentDay(cs: CircleStudy): StudyDay | undefined {
  const n = currentDayNumber(cs);
  return cs.study.days.find((d) => d.day_number === n);
}

export function isDayDone(completions: DayCompletion[], userId: string, day: number) {
  return completions.some((c) => c.user_id === userId && c.day_number === day);
}

/** How many members completed each day: [{ day: 1, count: 3 }, ...] */
export function progressByDay(cs: CircleStudy, completions: DayCompletion[]) {
  return cs.study.days.map((d) => ({
    day: d.day_number,
    count: completions.filter((c) => c.day_number === d.day_number).length,
  }));
}

export function percentComplete(cs: CircleStudy, completions: DayCompletion[], userId: string) {
  const mine = completions.filter((c) => c.user_id === userId).length;
  return Math.round((mine / cs.study.total_days) * 100);
}
