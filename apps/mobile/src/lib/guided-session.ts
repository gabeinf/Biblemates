export const GUIDED_STEPS = ['intro', 'read', 'reflect', 'together'] as const
export type GuidedStep = (typeof GUIDED_STEPS)[number]

export type GuidedState = {
  /** Index into GUIDED_STEPS. */
  index: number
  /** The current step unlocked Continue. */
  ready: boolean
  /** The user last moved forward (drives the chibi's cheer). */
  advanced: boolean
}

export type GuidedAction = { type: 'next' } | { type: 'back' } | { type: 'ready'; ready: boolean }

const LAST = GUIDED_STEPS.length - 1

/** Start at `resume` (clamped; junk becomes 0). */
export function initGuided(resume = 0): GuidedState {
  const index = Number.isInteger(resume) ? Math.min(Math.max(resume, 0), LAST) : 0
  return { index, ready: false, advanced: false }
}

export const isLastStep = (s: GuidedState) => s.index === LAST

/** `next` on the last step is a no-op: finishing is the shell's job. A new step starts locked. */
export function guidedReducer(s: GuidedState, a: GuidedAction): GuidedState {
  switch (a.type) {
    case 'next':
      return s.index >= LAST ? s : { index: s.index + 1, ready: false, advanced: true }
    case 'back':
      return s.index <= 0 ? s : { index: s.index - 1, ready: false, advanced: false }
    case 'ready':
      return s.ready === a.ready ? s : { ...s, ready: a.ready }
  }
}

const key = (circleStudyId: string, day: number) => `guided:${circleStudyId}:${day}`

/** Persisted step for this circle study + day, or 0. localStorage is expo-sqlite's, already installed. */
export function loadGuidedStep(circleStudyId: string, day: number): number {
  try {
    return Number(globalThis.localStorage?.getItem(key(circleStudyId, day))) || 0
  } catch {
    return 0
  }
}

/** Best-effort: pass `null` to clear. */
export function saveGuidedStep(circleStudyId: string, day: number, index: number | null) {
  try {
    if (index === null) globalThis.localStorage?.removeItem(key(circleStudyId, day))
    else globalThis.localStorage?.setItem(key(circleStudyId, day), String(index))
  } catch {
    // best-effort
  }
}
