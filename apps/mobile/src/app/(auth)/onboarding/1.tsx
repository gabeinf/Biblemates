/**
 * 01 · Intro. The lamb lands on the hill and the first sheet says "Meet your first lamb".
 * Replaces the verse splash: it waits for the user's Continue instead of auto-advancing.
 * See docs/specs/onboarding.md → "01 · Intro".
 */
import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { IntroView, haptic } from '../../../components/ui'
import { SPLASH_DESTINATION } from '../../../lib/onboarding-flow'
import { useAppReady } from '../../../lib/splash'
import { useTheme } from '../../../theme'

export default function Intro() {
  const router = useRouter()
  const ready = useAppReady()
  const theme = useTheme()

  // Fonts and session are still loading: the native splash (same brand color) is still covering us.
  if (!ready) return <View style={{ flex: 1, backgroundColor: theme.brand }} />
  return <IntroView onLanded={haptic.tap} onContinue={() => router.replace(SPLASH_DESTINATION)} />
}
