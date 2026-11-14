import { Stack } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ProgressBar from '../../../components/ProgressBar'
import { BackButton } from '../../../components/onboarding'
import { colors, spacing } from '../../../theme/tokens'

export default function OnboardingLayout() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
        <ProgressBar />
        {/* Balances the back button so the bar stays centred. */}
        <View style={styles.spacer} />
      </View>

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
