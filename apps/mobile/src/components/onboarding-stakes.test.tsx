import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react-native'
import { STAKES_CYCLE_MS, StakesCarousel } from './onboarding-stakes'
import { OnboardingDraftSchema } from '@biblemates/shared'
import { GAMBLING_WORDS, STAKES_PRESETS } from '../lib/stakes'

let mockReduceMotion = false
jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => mockReduceMotion }))

const value = () =>
  screen.getByTestId('stakes-value', { includeHiddenElements: true }).props.children
const tick = () =>
  act(async () => {
    jest.advanceTimersByTime(STAKES_CYCLE_MS)
  })

describe('StakesCarousel', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('cycles through every preset about every 2s and wraps around', async () => {
    mockReduceMotion = false
    await render(<StakesCarousel presets={STAKES_PRESETS} />)
    const seen = [value()]
    for (let i = 0; i < STAKES_PRESETS.length; i++) {
      await tick()
      seen.push(value())
    }
    expect(seen).toEqual([...STAKES_PRESETS.map((p) => p.label), STAKES_PRESETS[0].label])
  })

  it('stays on the first example under Reduce Motion', async () => {
    mockReduceMotion = true
    await render(<StakesCarousel presets={STAKES_PRESETS} />)
    await tick()
    await tick()
    expect(value()).toBe(STAKES_PRESETS[0].label)
  })

  it('reads every example once to screen readers', async () => {
    mockReduceMotion = false
    await render(<StakesCarousel presets={STAKES_PRESETS} />)
    const card = screen.getByLabelText(/^This week's stakes/)
    for (const p of STAKES_PRESETS) expect(card.props.accessibilityLabel).toContain(p.label)
  })
})

describe('stakes presets', () => {
  it('offers at least 3 wholesome examples with unique ids', () => {
    expect(STAKES_PRESETS.length).toBeGreaterThanOrEqual(3)
    expect(new Set(STAKES_PRESETS.map((p) => p.id)).size).toBe(STAKES_PRESETS.length)
    for (const p of STAKES_PRESETS) expect(p.label).not.toMatch(GAMBLING_WORDS)
  })

  it('fits the draft schema, so 12 can save a preset label as is', () => {
    for (const p of STAKES_PRESETS) {
      expect(
        OnboardingDraftSchema.safeParse({ stakes: { kind: 'preset', label: p.label } }).success,
      ).toBe(true)
    }
  })

  it('catches gambling language, including amounts', () => {
    for (const bad of ['Loser buys $5', 'Friendly bet', 'Winner gets cash']) {
      expect(bad).toMatch(GAMBLING_WORDS)
    }
    expect('Coffee on me').not.toMatch(GAMBLING_WORDS)
  })
})
