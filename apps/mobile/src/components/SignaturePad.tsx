/**
 * A rounded pad that captures finger (or mouse) strokes. Strokes stay in memory only.
 * Drawing uses a pan gesture from react-native-gesture-handler; the page never scrolls
 * underneath because the gesture claims the touch from the first point.
 */
import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler'
import { addPoint, segments, type Point, type Stroke } from '../lib/signature'
import { colors, radii } from '../theme/tokens'

const INK = 3

type Props = {
  strokes: readonly Stroke[]
  onChange: (strokes: readonly Stroke[]) => void
  /** Read by screen readers, e.g. "Signature pad. Draw your signature." */
  label: string
}

export function SignaturePad({ strokes, onChange, label }: Props) {
  // The latest strokes, so gesture callbacks never append to a stale copy.
  const latest = useRef(strokes)
  useEffect(() => {
    latest.current = strokes
  }, [strokes])

  const update = (next: readonly Stroke[]) => {
    latest.current = next
    onChange(next)
  }
  const point = (e: { x: number; y: number }): Point => ({ x: e.x, y: e.y })

  const pan = usePanGesture({
    minDistance: 0,
    // Strokes live in React state, so handle events on the JS thread.
    runOnJS: true,
    onBegin: (e) => update([...latest.current, [point(e)]]),
    onUpdate: (e) => {
      const all = latest.current
      const last = all.at(-1)
      if (!last) return
      const next = addPoint(last, point(e))
      if (next !== last) update([...all.slice(0, -1), next])
    },
  })

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.pad} accessible accessibilityLabel={label}>
        {strokes.flatMap((stroke, s) =>
          segments(stroke).map((seg, i) => (
            <View
              key={`${s}-${i}`}
              pointerEvents="none"
              style={[
                styles.ink,
                {
                  left: seg.left - INK / 2,
                  top: seg.top - INK / 2,
                  width: seg.length + INK,
                  transform: [{ rotate: `${seg.angle}rad` }],
                },
              ]}
            />
          )),
        )}
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  pad: {
    height: 200,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  ink: { position: 'absolute', height: INK, borderRadius: INK / 2, backgroundColor: colors.Ink },
})
