import { Stack } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ProgressBar from '../../../components/ProgressBar'
import { spacing } from '../../../theme/tokens'

export default function OnboardingLayout() {
  return (
    <SafeAreaView style={{ flex: 1, gap: spacing.lg }}>

      <View style={styles.progressBar}>
        <ProgressBar />
      </View>

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      />

    </SafeAreaView>
  )


}
const styles = StyleSheet.create({
  progressBar: {
    paddingLeft: spacing.xl,
    paddingTop: spacing.lg
  }
})