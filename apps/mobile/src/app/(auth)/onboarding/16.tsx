/**
 * 16 · Rating ask. A personal note from the team, then Continue asks the OS for a store
 * review (once per install; web and unsupported platforms just advance).
 * See docs/specs/onboarding.md → "16 · Rating ask".
 */
import { useRef } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import * as StoreReview from 'expo-store-review'
import Ionicons from '@expo/vector-icons/Ionicons'
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { StepHeading, StepScreen } from '../../../components/onboarding-step'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

/**
 * localStorage is expo-sqlite backed (installed by lib/supabase.ts) and wiped on uninstall, so
 * "once" means once per install. Without that install it silently no-ops and we'd ask every time.
 */
const ASKED_KEY = 'rating:asked'

/** Requests the native review prompt unless this install already did. Never throws. */
async function askForRating() {
  if (Platform.OS === 'web') return
  try {
    if (globalThis.localStorage?.getItem(ASKED_KEY)) return
    if (!(await StoreReview.isAvailableAsync())) return
    // Marked before asking: the OS decides whether to show it, and we never retry.
    globalThis.localStorage?.setItem(ASKED_KEY, '1')
    await StoreReview.requestReview()
  } catch {
    // Best effort: a missing module or storage must not block onboarding.
  }
}

/** An open book in a warm circle, with stars rising from its pages. Pure views and icons. */
function Illustration() {
  return (
    <View
      style={styles.circle}
      accessible
      accessibilityRole="image"
      accessibilityLabel="An open book with stars rising from its pages"
    >
      <Ionicons name="star" size={spacing.md} color={colors.Gold} style={styles.starLeft} />
      <Ionicons name="star" size={spacing.lg} color={colors.Gold} style={styles.starTop} />
      <Ionicons name="star" size={spacing.sm} color={colors.Gold} style={styles.starRight} />
      <Ionicons name="book" size={spacing.xxxl} color={colors.Ink} />
    </View>
  )
}

export default function RatingAsk() {
  const { goNext } = useOnboardingNav()
  const busy = useRef(false)

  const onContinue = async () => {
    if (busy.current) return
    busy.current = true
    try {
      await askForRating()
      goNext()
    } finally {
      busy.current = false
    }
  }

  return (
    <StepScreen mascot footer={<Button label="Continue" size="lg" onPress={onContinue} />}>
      <FadeIn>
        <StepHeading title="Before you go on, a thank-you" align="center" />
      </FadeIn>
      <FadeIn delay={80}>
        <View style={styles.copy}>
          <Text style={styles.line}>
            We’re a few friends who wanted a Bible habit that actually stuck, so we built the
            one we were missing.
          </Text>
          <Text style={styles.line}>
            If it’s helping already, a quick rating helps other circles find us. Thank you.
          </Text>
        </View>
      </FadeIn>
      <FadeIn delay={160} style={styles.art}>
        <Illustration />
      </FadeIn>
    </StepScreen>
  )
}

const CIRCLE = 176

const styles = StyleSheet.create({
  copy: { gap: spacing.md },
  line: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.muted,
    textAlign: 'center',
  },
  art: { alignItems: 'center' },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: radii.full,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starLeft: { position: 'absolute', top: spacing.xl + spacing.xs, left: spacing.xl + spacing.xs },
  starTop: { position: 'absolute', top: spacing.md, alignSelf: 'center' },
  starRight: { position: 'absolute', top: spacing.xl, right: spacing.xl + spacing.xs },
})
