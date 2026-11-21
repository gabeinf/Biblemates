import { useEffect, useState } from 'react'
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated'
import { motion, radius, useTheme } from '../../theme'

/** 10h meadow progress. `value` is 0..1. */
export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const theme = useTheme()
  const reduce = useReducedMotion()
  const [w, setW] = useState(0)
  const v = Math.min(1, Math.max(0, value))
  const x = useSharedValue(v)
  useEffect(() => {
    x.value = reduce ? v : withTiming(v, { duration: motion.duration.standard, easing: Easing.bezier(...motion.ease.out) })
  }, [v, reduce, x])
  const fill = useAnimatedStyle(() => ({ width: w * x.value }))
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: theme.surfaceSunken }]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: theme.progress }, fill]} />
    </View>
  )
}

const styles = StyleSheet.create({
  track: { height: 10, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: 10, borderRadius: radius.pill },
})
