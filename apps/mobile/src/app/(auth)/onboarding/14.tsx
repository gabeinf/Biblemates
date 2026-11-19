/**
 * 14 · Commitment. A small ritual: sign a promise to show up for your circle.
 * The signature never leaves the screen; only `committedAt` is saved.
 * See docs/specs/onboarding.md → "14 · Commitment".
 */
import { useEffect, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import * as Haptics from 'expo-haptics'
import Animated, { FadeIn as ReanimatedFadeIn, ZoomIn } from 'react-native-reanimated'
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { StepHeading, StepScreen } from '../../../components/onboarding-step'
import { SignaturePad } from '../../../components/SignaturePad'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { COMMIT_SUCCESS_MS, hasSignature, type Stroke } from '../../../lib/signature'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

const BADGE = 96

export default function Commitment() {
  const { goNext } = useOnboardingNav()
  const [strokes, setStrokes] = useState<readonly Stroke[]>([])
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const signed = hasSignature(strokes)

  const commit = () => {
    if (!signed || done) return
    setDone(true)
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined)
    }
    timer.current = setTimeout(
      () => goNext({ committedAt: new Date().toISOString() }),
      COMMIT_SUCCESS_MS,
    )
  }

  return (
    <View style={styles.screen}>
      <StepScreen
        footer={
          <View style={styles.footer}>
            <Button label="I’m in →" size="lg" disabled={!signed || done} onPress={commit} />
            <Text style={styles.caption}>Your signature stays on this phone.</Text>
          </View>
        }
      >
        <FadeIn>
          <StepHeading
            title="Make it official"
            subtitle="A promise to show up, for them and for you."
            align="center"
          />
        </FadeIn>
        <FadeIn delay={80} style={styles.padBlock}>
          <SignaturePad
            strokes={strokes}
            onChange={setStrokes}
            label="Signature pad. Draw your signature with one finger."
          />
          <Pressable
            onPress={() => setStrokes([])}
            disabled={strokes.length === 0}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Clear signature"
            style={styles.clear}
          >
            <Text style={[styles.clearText, strokes.length === 0 && styles.clearDisabled]}>
              Clear
            </Text>
          </Pressable>
        </FadeIn>
      </StepScreen>

      {done ? (
        <Animated.View
          entering={ReanimatedFadeIn.duration(200)}
          style={styles.overlay}
          accessibilityViewIsModal
          accessibilityLiveRegion="polite"
          accessibilityLabel="Committed"
        >
          <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.badge}>
            <Ionicons name="checkmark" size={44} color={colors.Gold} />
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  padBlock: { paddingTop: spacing.lg, gap: spacing.xs },
  clear: { alignSelf: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  clearText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Gold,
    textDecorationLine: 'underline',
  },
  clearDisabled: { color: colors.inactive },
  footer: { gap: spacing.sm },
  caption: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
    textAlign: 'center',
  },
  // Stands in for a blur (no blur dependency): the screen fades back behind the badge.
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    opacity: 0.96,
  },
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    // Soft gold glow.
    shadowColor: colors.Gold,
    shadowOpacity: 0.45,
    shadowRadius: spacing.lg,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
})
