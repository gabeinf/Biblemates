/** Pure geometry for the commitment signature pad (components/SignaturePad). */

export type Point = { x: number; y: number }
export type Stroke = readonly Point[]

/** Total ink needed before "I'm in" unlocks: a short deliberate line, not a stray tap. */
export const MIN_SIGNATURE_LENGTH = 60
/** How long the success badge on 14 shows before the flow moves on. */
export const COMMIT_SUCCESS_MS = 900
/** Points closer than this to the last one are dropped, to keep the stroke light. */
export const MIN_POINT_STEP = 2

const dist = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.y - a.y)

export function strokeLength(stroke: Stroke): number {
  let total = 0
  for (let i = 1; i < stroke.length; i++) total += dist(stroke[i - 1], stroke[i])
  return total
}

export function signatureLength(strokes: readonly Stroke[]): number {
  return strokes.reduce((sum, s) => sum + strokeLength(s), 0)
}

export function hasSignature(strokes: readonly Stroke[]): boolean {
  return signatureLength(strokes) >= MIN_SIGNATURE_LENGTH
}

/** Appends `p` unless it's within MIN_POINT_STEP of the stroke's last point. */
export function addPoint(stroke: Stroke, p: Point): Stroke {
  const last = stroke.at(-1)
  return last && dist(last, p) < MIN_POINT_STEP ? stroke : [...stroke, p]
}

export type Segment = { left: number; top: number; length: number; angle: number }

/**
 * A stroke as straight segments, each drawn as a thin rotated View: positioned by its
 * midpoint (left/top of a `length`-wide box centred there) and rotated by `angle` (radians).
 */
export function segments(stroke: Stroke): Segment[] {
  const out: Segment[] = []
  for (let i = 1; i < stroke.length; i++) {
    const a = stroke[i - 1]
    const b = stroke[i]
    const length = dist(a, b)
    out.push({
      left: (a.x + b.x) / 2 - length / 2,
      top: (a.y + b.y) / 2,
      length,
      angle: Math.atan2(b.y - a.y, b.x - a.x),
    })
  }
  return out
}
