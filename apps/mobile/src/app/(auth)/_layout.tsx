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
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="sign-in" />
    </Stack>
  )
}
