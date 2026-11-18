import { Stack } from 'expo-router'
import { colors } from '../../theme/tokens'

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="index" options={{ animation: 'fade' }} />
      {/* Onboarding fades in as a whole too; it never slides (see onboarding/_layout). */}
      <Stack.Screen
        name="onboarding"
        options={{ animation: 'fade', animationMatchesGesture: true }}
      />
      <Stack.Screen name="sign-in" />
    </Stack>
  )
}
