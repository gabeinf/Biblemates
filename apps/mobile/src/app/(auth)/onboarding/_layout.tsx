import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { BackHandler, Platform, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ProgressBar from '../../../components/ProgressBar'
import { BackButton } from '../../../components/onboarding'
import { markLaunchHandled, useCurrentStep, useOnboardingNav } from '../../../hooks/use-onboarding'
import { useOnboardingDraft } from '../../../lib/onboarding-draft'
import { hasHeader, progress } from '../../../lib/onboarding-flow'
import { colors, spacing } from '../../../theme/tokens'

export default function OnboardingLayout() {
  const step = useCurrentStep()
  const { path } = useOnboardingDraft()
  const { goBack } = useOnboardingNav()
  const router = useRouter()

  useEffect(markLaunchHandled, [])

  // Android back: let the stack pop when it can; with no history (a deep
  // link) go to the previous step like the header button, instead of leaving the app.
  useEffect(() => {
    if (Platform.OS !== 'android') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      // The splash moves on by itself; back there would leave mid-launch.
      if (step === 1) return true
      // The hook (02) is where the flow starts, so back leaves the app as usual.
      if (step === 2) return false
      if (router.canGoBack()) return false
      goBack()
      return true
    })
    return () => sub.remove()
  }, [router, goBack, step])

  const showHeader = step !== null && hasHeader(step)

  return (
    <SafeAreaView style={styles.screen} edges={showHeader ? undefined : ['left', 'right']}>
      {showHeader ? (
        <View style={styles.header}>
          <BackButton onPress={goBack} />
          <ProgressBar {...progress(step, path)} />
          {/* Balances the back button so the bar stays centred. */}
          <View style={styles.spacer} />
        </View>
      ) : null}

      <Stack
        screenOptions={{
          headerShown: false,
          // Onboarding never slides: each step fades in and its content eases in after
          // it (FadeIn), so the flow reads as one continuous moment, splash included.
          animation: 'fade',
          // iOS swipe-back also crossfades instead of falling back to the default slide.
          animationMatchesGesture: true,
          contentStyle: { backgroundColor: colors.paper },
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  spacer: { width: 40 },
})
