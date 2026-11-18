import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react-native'
import { STAKES_CYCLE_MS, StakesCarousel } from './onboarding-stakes'
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
    for (const p of STAKES_PRESETS) expect(screen.getByLabelText(new RegExp(p.label))).toBeTruthy()
  })
})

describe('stakes presets', () => {
  it('offers at least 3 wholesome examples with unique ids', () => {
    expect(STAKES_PRESETS.length).toBeGreaterThanOrEqual(3)
    expect(new Set(STAKES_PRESETS.map((p) => p.id)).size).toBe(STAKES_PRESETS.length)
    for (const p of STAKES_PRESETS) expect(p.label).not.toMatch(GAMBLING_WORDS)
  })
})
