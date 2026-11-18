/**
 * Chart card for 04: two curves drawn left to right on enter, each with an end label.
 * Built from plain views (see lib/chart-geometry.ts), so no SVG dependency is needed.
 */
import { useEffect, useState } from 'react'
import { Animated, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import { useReduceMotion } from '../hooks/use-reduce-motion'
import { chartPoints, segmentBox, type Point } from '../lib/chart-geometry'
import { colors, radii, spacing, typography } from '../theme/tokens'

export type ChartSeries = {
  label: string
  values: readonly number[]
  color: string
  /** The highlighted curve gets a thicker line and a tinted end label. */
  emphasis?: boolean
}

const PLOT_HEIGHT = 150
const LINE = 3
const LINE_THIN = 2
const DOT = 10
const DRAW_MS = 1100
/** Room above and below the plot so end dots and labels never clip. */
const PLOT_PAD = spacing.md

function Curve({
  points,
  color,
  thickness,
}: {
  points: Point[]
  color: string
  thickness: number
}) {
  return points.slice(1).map((b, i) => {
    const box = segmentBox(points[i], b, thickness)
    return (
      <View
        key={i}
        style={{
          position: 'absolute',
          // Each segment runs half a line past both ends, so the rounded caps overlap
          // at the joints and the curve reads as one stroke.
          left: box.left - thickness / 2,
          top: box.top,
          width: box.width + thickness,
          height: thickness,
          borderRadius: thickness / 2,
          backgroundColor: color,
          transform: [{ rotate: `${box.angle}rad` }],
        }}
      />
    )
  })
}

export function ChartCard({
  title,
  series,
  startLabel,
  endLabel,
  description,
}: {
  title: string
  /** What the chart shows, read by screen readers in place of the drawing. */
  description: string
  series: readonly ChartSeries[]
  startLabel: string
  endLabel: string
}) {
  const [width, setWidth] = useState(0)
  const reduceMotion = useReduceMotion()
  const [reveal] = useState(() => new Animated.Value(0))
  const [endFade] = useState(() => new Animated.Value(0))

  useEffect(() => {
    if (width === 0 || reduceMotion === null) return
    if (reduceMotion) {
      reveal.setValue(1)
      endFade.setValue(1)
      return
    }
    const anim = Animated.sequence([
      Animated.timing(reveal, {
        toValue: 1,
        duration: DRAW_MS,
        delay: 200,
        useNativeDriver: false,
      }),
      Animated.timing(endFade, { toValue: 1, duration: 250, useNativeDriver: false }),
    ])
    anim.start()
    return () => anim.stop()
  }, [width, reduceMotion, reveal, endFade])

  const onLayout = (e: LayoutChangeEvent) => setWidth(Math.round(e.nativeEvent.layout.width))
  const plotted = series.map((s) => ({ ...s, points: chartPoints(s.values, width, PLOT_HEIGHT) }))

  return (
    <View style={styles.card} accessible accessibilityRole="image" accessibilityLabel={description}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.plot} onLayout={onLayout}>
        {[0, 0.5, 1].map((g) => (
          <View key={g} style={[styles.grid, { top: PLOT_PAD + g * PLOT_HEIGHT }]} />
        ))}
        {width > 0 ? (
          <>
            <Animated.View
              style={[
                styles.reveal,
                {
                  width: reveal.interpolate({ inputRange: [0, 1], outputRange: [0, width + LINE] }),
                },
              ]}
            >
              {plotted.map((s) => (
                <Curve
                  key={s.label}
                  points={s.points}
                  color={s.color}
                  thickness={s.emphasis ? LINE : LINE_THIN}
                />
              ))}
            </Animated.View>
            {plotted.map((s) => {
              const end = s.points[s.points.length - 1]
              const above = s.emphasis
              return (
                <Animated.View
                  key={s.label}
                  style={[StyleSheet.absoluteFill, { opacity: endFade }]}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        left: end.x - DOT / 2,
                        top: PLOT_PAD + end.y - DOT / 2,
                        borderColor: s.color,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.endLabel,
                      s.emphasis && styles.endLabelEmphasis,
                      above
                        ? { bottom: PLOT_HEIGHT + PLOT_PAD * 2 - (PLOT_PAD + end.y) + spacing.xs }
                        : { top: PLOT_PAD + end.y + spacing.xs },
                    ]}
                  >
                    <Text
                      style={[styles.endLabelText, { color: s.emphasis ? s.color : colors.muted }]}
                    >
                      {s.label}
                    </Text>
                  </View>
                </Animated.View>
              )
            })}
          </>
        ) : null}
      </View>
      <View style={styles.axis}>
        <Text style={styles.axisLabel}>{startLabel}</Text>
        <Text style={styles.axisLabel}>{endLabel}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  plot: { height: PLOT_HEIGHT + PLOT_PAD * 2 },
  reveal: {
    position: 'absolute',
    left: 0,
    top: PLOT_PAD,
    height: PLOT_HEIGHT,
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.inactive,
  },
  dot: {
    position: 'absolute',
    width: DOT,
    height: DOT,
    borderRadius: radii.full,
    borderWidth: LINE_THIN,
    backgroundColor: colors.surface,
  },
  endLabel: {
    position: 'absolute',
    right: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    backgroundColor: colors.paper,
  },
  endLabelEmphasis: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.Gold,
  },
  endLabelText: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.caption },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  axisLabel: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
  },
})
