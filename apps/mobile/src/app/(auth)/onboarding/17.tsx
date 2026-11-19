/**
 * 17 · Notifications. Asks for notification permission once on enter; either answer moves on.
 * See docs/specs/onboarding.md → "17 · Notifications".
 */
import { useEffect, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Platform, StyleSheet, View } from 'react-native'
import * as Notifications from 'expo-notifications'
import Ionicons from '@expo/vector-icons/Ionicons'
import type { OnboardingDraft } from '@biblemates/shared'
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { StepHeading, StepScreen } from '../../../components/onboarding-step'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { getDraft } from '../../../lib/onboarding-draft'
import { colors, spacing } from '../../../theme/tokens'

type Result = NonNullable<OnboardingDraft['notifications']>

/** Asks the OS once. Granted, or denied for good, skips the prompt; any failure counts as unavailable. */
async function askForPermission(): Promise<Result> {
  try {
    const current = await Notifications.getPermissionsAsync()
    if (current.granted) return 'granted'
    if (current.status === 'denied' && !current.canAskAgain) return 'denied'
    const asked = await Notifications.requestPermissionsAsync()
    return asked.granted ? 'granted' : 'denied'
  } catch {
    return 'unavailable'
  }
}

/** Arrow under the OS dialog's "Allow" side. Bobs gently, and holds still on Reduce Motion. */
function PointerHint() {
  const [bob] = useState(() => new Animated.Value(0))

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined
    let cancelled = false
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => true)
      .then((reduce) => {
        if (cancelled || reduce) return
        loop = Animated.loop(
          Animated.sequence([
            Animated.timing(bob, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.timing(bob, { toValue: 0, duration: 700, useNativeDriver: true }),
          ]),
        )
        loop.start()
      })
    return () => {
      cancelled = true
      loop?.stop()
    }
  }, [bob])

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -spacing.xs] })
  return (
    <Animated.View
      style={[styles.pointer, { transform: [{ translateY }] }]}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      <Ionicons name="arrow-up" size={spacing.xl} color={colors.Gold} />
    </Animated.View>
  )
}

export default function NotificationsStep() {
  const { goNext } = useOnboardingNav()
  const isWeb = Platform.OS === 'web'
  // Coming back from 18 shows the screen with Continue rather than asking (or skipping) again.
  const [answered] = useState(() => getDraft().notifications !== undefined)
  const asked = useRef(false)
  const showContinue = isWeb || answered

  useEffect(() => {
    if (showContinue || asked.current) return
    asked.current = true
    askForPermission().then((notifications) => goNext({ notifications }))
  }, [showContinue, goNext])

  return (
    <StepScreen
      footer={
        showContinue ? (
          <Button
            label="Continue"
            size="lg"
            onPress={() => goNext(isWeb && !answered ? { notifications: 'unavailable' } : {})}
          />
        ) : null
      }
    >
      <FadeIn>
        <StepHeading
          title="Know when your circle reads"
          subtitle="Small nudges that keep you in step."
          align="center"
        />
      </FadeIn>
      {/* Room for the OS dialog, which draws itself; the arrow points at its "Allow" side. */}
      {showContinue ? null : (
        <View style={styles.dialogSpace}>
          <PointerHint />
        </View>
      )}
    </StepScreen>
  )
}

const styles = StyleSheet.create({
  dialogSpace: { minHeight: 240, justifyContent: 'flex-end', alignItems: 'flex-end' },
  pointer: { marginRight: spacing.xl },
})
