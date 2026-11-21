import { useEffect, type PropsWithChildren } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated'
import { motion } from '../../theme'

/** Fades + lifts its children in after `delay` ms. With Reduce Motion everything just appears. */
export function Reveal({
  delay = 0,
  scaleFrom = 1,
  style,
  children,
}: PropsWithChildren<{ delay?: number; scaleFrom?: number; style?: StyleProp<ViewStyle> }>) {
  const reduce = useReducedMotion()
  const t = useSharedValue(reduce ? 1 : 0)
  useEffect(() => {
    if (reduce) return
    t.value = withDelay(delay, withTiming(1, { duration: motion.duration.standard, easing: Easing.bezier(...motion.ease.out) }))
  }, [delay, reduce, t])
  const anim = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 8 }, { scale: scaleFrom + (1 - scaleFrom) * t.value }],
  }))
  return <Animated.View style={[anim, style]}>{children}</Animated.View>
}
