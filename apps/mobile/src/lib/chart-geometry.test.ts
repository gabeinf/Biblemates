import { describe, expect, it } from '@jest/globals'
import { chartPoints, segmentBox } from './chart-geometry'

describe('chartPoints', () => {
  it('spreads values across the width, with 1 at the top and 0 at the bottom', () => {
    expect(chartPoints([1, 0.5, 0], 200, 100)).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { x: 200, y: 100 },
    ])
  })

  it('clamps values outside 0–1 to the box', () => {
    expect(chartPoints([1.5, -1], 10, 10)).toEqual([
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ])
  })

  it('handles a single point', () => {
    expect(chartPoints([0.5], 100, 10)).toEqual([{ x: 0, y: 5 }])
  })
})

describe('segmentBox', () => {
  it('lays a horizontal segment flat between its ends', () => {
    expect(segmentBox({ x: 0, y: 10 }, { x: 40, y: 10 }, 4)).toEqual({
      left: 0,
      top: 8,
      width: 40,
      angle: 0,
    })
  })

  it('centres a sloped segment on its midpoint and rotates it to match', () => {
    const box = segmentBox({ x: 0, y: 0 }, { x: 30, y: 40 }, 2)
    expect(box.width).toBe(50)
    // Centre of the unrotated box sits on the midpoint (15, 20).
    expect(box.left + box.width / 2).toBe(15)
    expect(box.top + 1).toBe(20)
    expect(box.angle).toBeCloseTo(Math.atan2(40, 30))
  })
})
