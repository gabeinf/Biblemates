import { describe, expect, it } from '@jest/globals'
import {
  GUIDED_STEPS,
  guidedReducer,
  initGuided,
  isLastStep,
  loadGuidedStep,
  saveGuidedStep,
} from './guided-session'

const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  },
})

describe('guidedReducer', () => {
  it('walks next/back and locks each new step until it is ready', () => {
    let s = initGuided()
    s = guidedReducer(s, { type: 'ready', ready: true })
    s = guidedReducer(s, { type: 'next' })
    expect(s).toEqual({ index: 1, ready: false, advanced: true })
    s = guidedReducer(s, { type: 'back' })
    expect(s).toEqual({ index: 0, ready: false, advanced: false })
  })

  it('does not move past either end', () => {
    expect(guidedReducer(initGuided(), { type: 'back' }).index).toBe(0)
    const last = initGuided(99)
    expect(isLastStep(last)).toBe(true)
    expect(guidedReducer(last, { type: 'next' })).toBe(last)
  })

  it('clamps the resume index and ignores junk', () => {
    expect(initGuided(2).index).toBe(2)
    expect(initGuided(-3).index).toBe(0)
    expect(initGuided(NaN).index).toBe(0)
    expect(initGuided(GUIDED_STEPS.length).index).toBe(GUIDED_STEPS.length - 1)
  })

  it('is pure', () => {
    const s = initGuided(1)
    guidedReducer(s, { type: 'next' })
    expect(s).toEqual({ index: 1, ready: false, advanced: false })
  })
})

describe('persisted step', () => {
  it('round-trips per circle study + day and clears', () => {
    expect(loadGuidedStep('cs1', 3)).toBe(0)
    saveGuidedStep('cs1', 3, 2)
    expect(loadGuidedStep('cs1', 3)).toBe(2)
    expect(loadGuidedStep('cs1', 4)).toBe(0)
    saveGuidedStep('cs1', 3, null)
    expect(loadGuidedStep('cs1', 3)).toBe(0)
  })
})
