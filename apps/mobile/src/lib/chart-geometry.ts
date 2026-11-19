/**
 * Geometry for line charts drawn with plain views (no SVG dependency): each curve is a
 * chain of thin rotated rectangles, one per segment between neighbouring points.
 */

export type Point = { x: number; y: number }

/**
 * Spreads `values` (0 = bottom, 1 = top) evenly across a `width` × `height` box.
 * Values outside 0–1 are clamped so a typo can't draw outside the card.
 */
export function chartPoints(values: readonly number[], width: number, height: number): Point[] {
  const step = values.length > 1 ? width / (values.length - 1) : 0
  return values.map((v, i) => ({
    x: i * step,
    y: (1 - Math.min(1, Math.max(0, v))) * height,
  }))
}

/**
 * Position, length and angle for a `thickness`-tall rectangle that joins `a` to `b`.
 * The rectangle is laid out centred on the segment's midpoint, then rotated about its
 * centre (React Native's default transform origin).
 */
export function segmentBox(a: Point, b: Point, thickness: number) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const length = Math.hypot(dx, dy)
  return {
    left: (a.x + b.x) / 2 - length / 2,
    top: (a.y + b.y) / 2 - thickness / 2,
    width: length,
    angle: Math.atan2(dy, dx),
  }
}
