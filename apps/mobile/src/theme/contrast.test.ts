import { describe, expect, it } from '@jest/globals'
import { allContrastFailures, ratio } from './contrast'
import { makeTheme } from './semantic'
import { goldenHour, testInverted } from './palettes'

describe('contrast', () => {
  it('computes known ratios', () => {
    expect(ratio('#000000', '#FFFFFF')).toBeCloseTo(21, 0)
    expect(ratio('#777777', '#777777')).toBe(1)
  })
  it('every palette passes WCAG AA for every role pair', () => {
    expect(allContrastFailures()).toEqual([])
  })
  it('palettes export identical keys and re-theme the roles', () => {
    expect(Object.keys(testInverted).sort()).toEqual(Object.keys(goldenHour).sort())
    expect(makeTheme(testInverted).primary).not.toBe(makeTheme(goldenHour).primary)
  })
})
