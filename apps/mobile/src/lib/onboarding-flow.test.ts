import { describe, expect, it } from '@jest/globals'
import {
  backHref,
  hasHeader,
  HOOK_READERS,
  HOOK_WEEKS,
  nextStep,
  parseStep,
  prevStep,
  progress,
  SPLASH_MAX_MS,
  SPLASH_MIN_MS,
  SPLASH_MS,
  SPLASH_VERSE,
  SPLASH_DESTINATION,
  stepHref,
  stepsFor,
  verseRevealMs,
} from './onboarding-flow'

/** Walks the flow from step 1 by following nextStep, like a user tapping Continue. */
function walk(path: 'create' | 'join') {
  const seen = []
  for (let s: ReturnType<typeof nextStep> = 1; s !== null; s = nextStep(s, path)) seen.push(s)
  return seen
}

describe('onboarding flow', () => {
  it('create path visits every numbered step in order', () => {
    expect(walk('create')).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
    ])
  })

  it('join path swaps goal, stakes and invite for the code step', () => {
    const steps = walk('join')
    expect(steps).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 'join', 13, 14, 16, 17, 18, 19])
    expect(steps).not.toEqual(expect.arrayContaining([10, 11, 12, 15]))
  })

  it('defaults to the create path before the fork', () => {
    expect(nextStep(9, undefined)).toBe(10)
    expect(nextStep(9, 'join')).toBe('join')
  })

  it('prevStep reverses nextStep on both paths', () => {
    for (const path of ['create', 'join'] as const) {
      const steps = stepsFor(path)
      steps.slice(1).forEach((s, i) => expect(prevStep(s, path)).toBe(steps[i]))
      expect(prevStep(1, path)).toBeNull()
    }
  })

  it('ends after step 19', () => {
    expect(nextStep(19, 'create')).toBeNull()
    expect(nextStep(19, 'join')).toBeNull()
  })

  it('progress rises on every step and reaches 1 at the end', () => {
    for (const path of ['create', 'join'] as const) {
      const fractions = stepsFor(path).map((s) => progress(s, path).fraction)
      fractions.slice(1).forEach((f, i) => expect(f).toBeGreaterThan(fractions[i]))
      expect(fractions.at(-1)).toBe(1)
    }
    expect(progress('join', 'join')).toMatchObject({ position: 10, total: 16 })
  })

  it('parses route params and rejects anything else', () => {
    expect(parseStep('3')).toBe(3)
    expect(parseStep('join')).toBe('join')
    for (const bad of ['0', '20', '3.5', 'abc', '', undefined, ['3']])
      expect(parseStep(bad)).toBeNull()
  })

  it('builds hrefs and hides the header on 01 and 02', () => {
    expect(stepHref(7)).toBe('/onboarding/7')
    expect(stepHref('join')).toBe('/onboarding/join')
    expect([1, 2, 3].map(hasHeader)).toEqual([false, false, true])
  })

  it('never moves the bar backwards when switching paths at the fork', () => {
    const at9 = progress(9, 'join').fraction
    expect(progress(9, 'create').fraction).toBe(at9)
    expect(progress('join', 'join').fraction).toBeGreaterThan(at9)
    expect(progress(10, 'create').fraction).toBeGreaterThan(at9)
  })

  it('falls back to the path that has the step when the draft disagrees', () => {
    expect(nextStep(10, 'join')).toBe(11)
    expect(prevStep('join', 'create')).toBe(9)
    expect(progress(10, 'join').position).toBe(10)
  })

  it('back with no history goes to the previous step, never past the hook', () => {
    expect(backHref(13, 'join')).toBe('/onboarding/join')
    expect(backHref(13, 'create')).toBe('/onboarding/12')
    expect(backHref(3, 'create')).toBe('/onboarding/2')
  })
})

describe('splash (01)', () => {
  it('always starts at the hook (02): onboarding never resumes after a restart', () => {
    expect(SPLASH_DESTINATION).toBe('/onboarding/2')
  })

  it('stays up between 1.2s and 2.5s, long enough for the verse to finish', () => {
    expect(SPLASH_MS).toBeGreaterThanOrEqual(SPLASH_MIN_MS)
    expect(SPLASH_MS).toBeLessThanOrEqual(SPLASH_MAX_MS)
    // Every word plus the reference line, with a beat to read it.
    const words = SPLASH_VERSE.split(' ').length
    expect(verseRevealMs(words + 1) + 400).toBeLessThanOrEqual(SPLASH_MS)
    expect(verseRevealMs(0)).toBe(0)
  })
})

describe('hook (02)', () => {
  it('leads to step 03 on either path', () => {
    expect(nextStep(2, undefined)).toBe(3)
    expect(nextStep(2, 'join')).toBe(3)
    expect(hasHeader(2)).toBe(false)
  })

  it('shows a full week 1 against a mostly missed week 3', () => {
    const [before, after] = HOOK_WEEKS
    const share = (w: (typeof HOOK_WEEKS)[number]) =>
      w.days.flat().filter(Boolean).length / w.days.flat().length
    for (const w of HOOK_WEEKS) {
      expect(w.days).toHaveLength(HOOK_READERS.length)
      w.days.forEach((row) => expect(row).toHaveLength(7))
    }
    expect(share(before)).toBe(1)
    expect(share(after)).toBeLessThan(0.5)
  })
})
