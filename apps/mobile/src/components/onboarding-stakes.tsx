/**
 * "This week's stakes" card for 07. Cycles through example stakes about every 2s, with a
 * dot row under it. Cycling pauses under Reduce Motion. Screen readers hear every example
 * once instead of a value that keeps changing.
 */
import { useEffect, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useReducedMotion } from 'react-native-reanimated'
import { Avatar } from './ui'
import type { StakesPreset } from '../lib/stakes'
import { colors, radii, spacing, typography } from '../theme/tokens'

export const STAKES_CYCLE_MS = 2000
const FADE_MS = 300
const ICON = 28
const AVATAR = 44
const DOT = 8

/** Made-up members for the "who owes whom" picture. */
const OWES = { from: 'Ana Reyes', to: 'Ben Cole' }

export function StakesCarousel({ presets }: { presets: readonly StakesPreset[] }) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [fade] = useState(() => new Animated.Value(1))

  useEffect(() => {
    if (reduceMotion || presets.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % presets.length), STAKES_CYCLE_MS)
    return () => clearInterval(id)
  }, [reduceMotion, presets.length])

  // Each new example fades in.
  useEffect(() => {
    if (reduceMotion || index === 0) return
    fade.setValue(0)
    Animated.timing(fade, { toValue: 1, duration: FADE_MS, useNativeDriver: true }).start()
  }, [index, reduceMotion, fade])

  const current = presets[index]
  const examples = presets.map((p) => p.label).join(', ')

  return (
    <View style={styles.wrap}>
      <View
        style={styles.card}
        accessible
        accessibilityLabel={`This week's stakes, for example: ${examples}. If someone misses their reading goal, they owe the others.`}
      >
        <Text style={styles.eyebrow}>This week’s stakes</Text>
        <Animated.View style={[styles.value, { opacity: fade }]}>
          <Ionicons name={current.icon} size={ICON} color={colors.surface} />
          <Text testID="stakes-value" style={styles.valueText}>
            {current.label}
          </Text>
        </Animated.View>
        <View style={styles.owes}>
          <View style={styles.avatarDisc}>
            <Avatar name={OWES.from} size={AVATAR} />
          </View>
          <Ionicons name="arrow-forward" size={20} color={colors.surface} />
          <View style={styles.avatarDisc}>
            <Avatar name={OWES.to} size={AVATAR} />
          </View>
        </View>
        <Text style={styles.owesCaption}>Missed the goal? You owe the circle.</Text>
      </View>

      <View
        style={styles.dots}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {presets.map((p, i) => (
          <View key={p.id} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, alignItems: 'center' },
  card: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.Gold,
  },
  eyebrow: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.surface,
  },
  value: { alignItems: 'center', gap: spacing.xs },
  valueText: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    color: colors.surface,
    textAlign: 'center',
  },
  owes: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  // Avatar's tint is translucent, so give it a light disc to sit on against the gold.
  avatarDisc: { borderRadius: radii.full, backgroundColor: colors.surface },
  owesCaption: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.surface,
  },
  dots: { flexDirection: 'row', gap: spacing.xs },
  dot: { width: DOT, height: DOT, borderRadius: radii.full, backgroundColor: colors.inactive },
  dotActive: { backgroundColor: colors.Gold, width: DOT * 2.5 },
})
