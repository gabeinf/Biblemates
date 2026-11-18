import { useEffect } from 'react'
import { Stack, useRouter } from 'expo-router'
import { BackHandler, Platform, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ProgressBar from '../../../components/ProgressBar'
import { BackButton } from '../../../components/onboarding'
import { markResumeOffered, useCurrentStep, useOnboardingNav } from '../../../hooks/use-onboarding'
import { updateDraft, useOnboardingDraft } from '../../../lib/onboarding-draft'
import { hasHeader, progress } from '../../../lib/onboarding-flow'
import { colors, spacing } from '../../../theme/tokens'

export default function OnboardingLayout() {
  const step = useCurrentStep()
  const { path } = useOnboardingDraft()
  const { goBack } = useOnboardingNav()
  const router = useRouter()

  useEffect(markResumeOffered, [])

  // Android back: let the stack pop when it can; with no history (cold resume, deep
  // link) go to the previous step like the header button, instead of leaving the app.
  useEffect(() => {
    if (Platform.OS !== 'android') return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) return false
      goBack()
      return true
    })
    return () => sub.remove()
  }, [router, goBack])

  // Remember where the user is so a restart resumes here.
  useEffect(() => {
    if (step !== null) updateDraft({ step })
  }, [step])

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
          animation: 'slide_from_right',
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
