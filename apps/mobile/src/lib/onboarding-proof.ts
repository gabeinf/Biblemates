/**
 * Content for 04 · Consistency proof. See docs/specs/onboarding.md → "04 · Consistency proof".
 *
 * PLACEHOLDER(stats): these curves are illustrative shapes, not measured data, and the
 * copy below makes no numeric claim. Swap in a sourced number (and cite it here) once
 * we have one: spec open question 3.
 */

/** Twelve weekly readings, 0 (none) to 1 (every planned day). Illustrative only. */
export const PROOF_WEEKS = 12

export const PROOF_CIRCLE: readonly number[] = [
  0.78, 0.8, 0.79, 0.82, 0.81, 0.83, 0.84, 0.83, 0.85, 0.86, 0.86, 0.88,
]
export const PROOF_ALONE: readonly number[] = [
  0.78, 0.76, 0.7, 0.6, 0.48, 0.38, 0.3, 0.25, 0.21, 0.19, 0.18, 0.17,
]

export const PROOF_STAT = 'Steadier when you’re not alone'
export const PROOF_CAPTION =
  'An illustration of the pattern, not a study. We’ll share real numbers once we have them.'
