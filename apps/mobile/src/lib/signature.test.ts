import { describe, expect, it } from '@jest/globals'
import { MIN_SIGNATURE_LENGTH, addPoint, hasSignature, segments, strokeLength } from './signature'

describe('strokeLength / hasSignature', () => {
  it('measures the ink across strokes', () => {
    expect(
      strokeLength([
        { x: 0, y: 0 },
        { x: 3, y: 4 },
      ]),
    ).toBe(5)
    expect(hasSignature([])).toBe(false)
    expect(hasSignature([[{ x: 0, y: 0 }]])).toBe(false)
    const half = MIN_SIGNATURE_LENGTH / 2
    expect(
      hasSignature([
        [
          { x: 0, y: 0 },
          { x: half, y: 0 },
        ],
      ]),
    ).toBe(false)
    expect(
      hasSignature([
        [
          { x: 0, y: 0 },
          { x: half, y: 0 },
        ],
        [
          { x: 0, y: 10 },
          { x: half, y: 10 },
        ],
      ]),
    ).toBe(true)
  })
})

describe('addPoint', () => {
  it('drops points too close to the last one', () => {
    const s = addPoint([{ x: 0, y: 0 }], { x: 1, y: 0 })
    expect(s).toHaveLength(1)
    expect(addPoint(s, { x: 5, y: 0 })).toHaveLength(2)
    expect(addPoint([], { x: 5, y: 0 })).toEqual([{ x: 5, y: 0 }])
  })
})

describe('segments', () => {
  it('centres each segment on its midpoint with the right angle', () => {
    const [seg] = segments([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
    ])
    expect(seg).toEqual({ left: 0, top: 0, length: 10, angle: 0 })
    const [down] = segments([
      { x: 0, y: 0 },
      { x: 0, y: 10 },
    ])
    expect(down.left).toBe(-5)
    expect(down.top).toBe(5)
    expect(down.angle).toBeCloseTo(Math.PI / 2)
  })
})
