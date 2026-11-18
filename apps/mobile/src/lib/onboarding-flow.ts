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
 * Where "back" goes when there's no history to pop (deep link, web reload). The splash
 * (01) is never a back target: it would only bounce the user forward again, so the
 * hook (02) is as far back as the flow goes. 02 itself has no back target: on Android
 * the layout lets the system handle back there.
 */
export function backHref(step: OnboardingStepId, path: Path | undefined): string {
  const prev = prevStep(step, path)
  return prev === null || prev === 1 ? stepHref(2) : stepHref(prev)
}

/**
 * What each step is for. Users never see step numbers (those are only for files, routes
 * and the spec). The placeholder screen uses these as its title; delete this map along
 * with `[step].tsx` once every step has its own screen.
 */
export const STEP_PURPOSES: Readonly<Record<OnboardingStepId, string>> = {
  1: 'Welcome',
  2: 'Why we drift',
  3: 'What draws you here',
  4: 'Why it works',
  5: 'Voices',
  6: 'Your rhythm',
  7: 'A little stakes',
  8: 'Read together',
  9: 'Start or join',
  join: 'Join with a code',
  10: 'Days per week',
  11: 'How stakes work',
  12: 'Pick your stakes',
  13: 'Your name',
  14: 'Your commitment',
  15: 'Invite your circle',
  16: 'Enjoying it so far?',
  17: 'Reminders',
  18: 'How you found us',
  19: 'Save your plan',
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

/**
 * Where the splash (01) sends a signed-out user: always the hook (02). Onboarding isn't
 * saved across launches, so closing the app starts over. Signed-in users never reach the
 * splash: the root layout's guard sends them to /home.
 */
export const SPLASH_DESTINATION = stepHref(2)

/** The splash stays up for SPLASH_MS once loading is done (spec: 1.2s–2.5s). */
export const SPLASH_MIN_MS = 1200
export const SPLASH_MAX_MS = 2500
export const SPLASH_MS = 2000

/** The splash verse, revealed word by word. */
export const SPLASH_VERSE = 'Draw near to God, and he will draw near to you.'
export const SPLASH_VERSE_REFERENCE = 'James 4:8'

/** Word-by-word verse reveal on the splash. */
export const VERSE_DELAY_MS = 300
export const VERSE_STAGGER_MS = 70
export const VERSE_WORD_MS = 320

/** When the last of `words` finishes fading in, measured from when loading is done. */
export function verseRevealMs(words: number): number {
  return words === 0 ? 0 : VERSE_DELAY_MS + (words - 1) * VERSE_STAGGER_MS + VERSE_WORD_MS
}

/** A week of the plan on the hook (02): each reader's seven days, read or missed. */
export type HookWeek = { label: string; together: boolean; days: readonly (readonly boolean[])[] }

/** Made-up readers for the hook illustration. */
export const HOOK_READERS = ['Ana Reyes', 'Ben Cole', 'Joy Kim'] as const

const o = true
const _ = false
/** Week 1 everyone reads every day; by week 3 the days have mostly slipped. */
export const HOOK_WEEKS: readonly HookWeek[] = [
  {
    label: 'Week 1',
    together: true,
    days: [
      [o, o, o, o, o, o, o],
      [o, o, o, o, o, o, o],
      [o, o, o, o, o, o, o],
    ],
  },
  {
    label: 'Week 3',
    together: false,
    days: [
      [o, _, _, o, _, _, _],
      [_, o, _, _, _, _, _],
      [_, _, _, _, o, _, _],
    ],
  },
]
