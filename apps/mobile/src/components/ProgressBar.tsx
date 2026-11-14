import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { usePathname } from 'expo-router'
import { colors, spacing } from '../theme/tokens'

/** Onboarding steps, in order. The bar fills up to the current one. */
export const ONBOARDING_STEPS = ['/step-1', '/step-2'] as const

function Segment({ filled }: { filled: boolean }) {
  const fill = useRef(new Animated.Value(filled ? 1 : 0)).current
  useEffect(() => {
    Animated.timing(fill, { toValue: filled ? 1 : 0, duration: 350, useNativeDriver: false }).start()
  }, [filled, fill])

  return (
    <View style={styles.segment}>
      <Animated.View
        style={[styles.fill, { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
      />
    </View>
  )
}

export default function ProgressBar() {
  const pathname = usePathname()
  const current = Math.max(0, ONBOARDING_STEPS.indexOf(pathname as (typeof ONBOARDING_STEPS)[number]))

  return (
    <View
      style={styles.bar}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current + 1} of ${ONBOARDING_STEPS.length}`}
      accessibilityValue={{ min: 1, max: ONBOARDING_STEPS.length, now: current + 1 }}
    >
      {ONBOARDING_STEPS.map((step, i) => (
        <Segment key={step} filled={i <= current} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: { flex: 1, flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.inactive, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.Gold },
})
