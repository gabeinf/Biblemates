/**
 * Stand-in for onboarding steps that aren't built yet, so the whole flow can be walked
 * end to end. Each screen issue adds `onboarding/<n>.tsx`, which takes priority over
 * this dynamic route. Delete this file once every step exists.
 */
import { Redirect, useLocalSearchParams } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { Button } from '../../../components/ui'
import { AuthScreen, ScreenTitle } from '../../../components/onboarding'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { STEP_PURPOSES, parseStep } from '../../../lib/onboarding-flow'
import { spacing } from '../../../theme/tokens'

export default function PlaceholderStep() {
  const { step: param } = useLocalSearchParams<{ step: string }>()
  const step = parseStep(param)
  const { goNext } = useOnboardingNav()

  if (step === null) return <Redirect href="/" />

  // Step 09 is where the flow forks, so the placeholder offers both paths.
  const footer =
    step === 9 ? (
      <View style={styles.buttons}>
        <Button
          label="I have an invite code"
          variant="outline"
          size="lg"
          onPress={() => goNext({ path: 'join' })}
        />
        <Button
          label="Start a circle plan"
          size="lg"
          onPress={() => goNext({ path: 'create', inviteCode: undefined })}
        />
      </View>
    ) : (
      <Button label="Continue" size="lg" onPress={() => goNext()} />
    )

  return (
    <AuthScreen footer={footer}>
      <ScreenTitle
        eyebrow="Coming soon"
        title={STEP_PURPOSES[step]}
        subtitle="This step hasn’t been built yet."
      />
    </AuthScreen>
  )
}

const styles = StyleSheet.create({
  buttons: { gap: spacing.sm },
})
