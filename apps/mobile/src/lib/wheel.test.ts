import { describe, expect, it } from '@jest/globals'
import { daysSuffix, wheelIndex } from './wheel'

describe('wheelIndex', () => {
  it('rounds to the nearest row', () => {
    expect(wheelIndex(0, 64, 7)).toBe(0)
    expect(wheelIndex(31, 64, 7)).toBe(0)
    expect(wheelIndex(33, 64, 7)).toBe(1)
    expect(wheelIndex(128, 64, 7)).toBe(2)
  })

  it('clamps overscroll at both ends', () => {
    expect(wheelIndex(-80, 64, 7)).toBe(0)
    expect(wheelIndex(10_000, 64, 7)).toBe(6)
  })

  it('handles an empty list', () => {
    expect(wheelIndex(100, 64, 0)).toBe(0)
  })
})

describe('daysSuffix', () => {
  it('is singular only for 1', () => {
    expect(daysSuffix(1)).toBe('day')
    expect(daysSuffix(2)).toBe('days')
    expect(daysSuffix(7)).toBe('days')
  })
})
