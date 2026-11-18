/**
 * Step order for onboarding, and the pure helpers that move through it.
 * See docs/specs/onboarding.md → "Flow at a glance".
 */
import type { OnboardingDraft, OnboardingStepId } from '@biblemates/shared'

type Path = NonNullable<OnboardingDraft['path']>

const CREATE: readonly OnboardingStepId[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
]
// Joiners skip goal + stakes (10–12, set by the circle's creator) and invite (15).
const JOIN: readonly OnboardingStepId[] = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  'join',
  13,
  14,
  16,
  17,
  18,
  19,
]

/** Steps 01 and 02 draw their own full-screen layout: no back button or progress bar. */
const HEADERLESS: readonly OnboardingStepId[] = [1, 2]

export function stepsFor(path: Path | undefined): readonly OnboardingStepId[] {
  return path === 'join' ? JOIN : CREATE
}

export function stepHref(step: OnboardingStepId): `/onboarding/${string}` {
  return `/onboarding/${step}`
}

/** Reads a route param ('3', 'join') back into a step id, or null if it isn't one. */
export function parseStep(param: string | string[] | undefined): OnboardingStepId | null {
  if (param === 'join') return 'join'
  if (typeof param !== 'string' || !/^\d+$/.test(param)) return null
  const n = Number(param)
  return CREATE.includes(n) ? n : null
}

/** The user's path if `step` is on it; otherwise whichever path has it (a stale draft or a typed URL). */
function pathContaining(step: OnboardingStepId, path: Path | undefined): readonly OnboardingStepId[] {
  const steps = stepsFor(path)
  if (steps.includes(step)) return steps
  return CREATE.includes(step) ? CREATE : JOIN
}

/** The step after `step`, or null at the end of the flow. */
export function nextStep(step: OnboardingStepId, path: Path | undefined): OnboardingStepId | null {
  const steps = pathContaining(step, path)
  return steps[steps.indexOf(step) + 1] ?? null
}

/** The step before `step`, or null at the start of the flow. */
export function prevStep(step: OnboardingStepId, path: Path | undefined): OnboardingStepId | null {
  const steps = pathContaining(step, path)
  const i = steps.indexOf(step)
  return i <= 0 ? null : steps[i - 1]
}

/**
 * Where "back" goes when there's no history to pop (cold resume, deep link).
 * The welcome screen stands in for 01–02 until those screens are built (#4, #5).
 */
export function backHref(step: OnboardingStepId, path: Path | undefined): string {
  const prev = prevStep(step, path)
  return prev === null || prev === 1 || prev === 2 ? '/' : stepHref(prev)
}

export function hasHeader(step: OnboardingStepId): boolean {
  return !HEADERLESS.includes(step)
}

/** Steps 01–09 are shared by both paths; the fork happens after 09. */
const FORK_INDEX = CREATE.indexOf(9)

/**
 * Progress as a 0–1 fraction plus a 1-based position. Before the fork every user is
 * measured against the longer create path, so switching paths at 09 (or going back and
 * switching again) never moves the bar backwards.
 */
export function progress(step: OnboardingStepId, path: Path | undefined) {
  const steps = pathContaining(step, path)
  const i = Math.max(0, steps.indexOf(step))
  const total = i <= FORK_INDEX ? CREATE.length : steps.length
  return { position: i + 1, total, fraction: (i + 1) / total }
}
