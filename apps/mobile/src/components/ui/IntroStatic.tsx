import { useEffect, useRef } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { space, useTheme } from '../../theme'
import { AppText } from './AppText'
import { ChunkyButton } from './ChunkyButton'
import { Sheet } from './Sheet'

const landed = require('../../../assets/scenes/intro-landed.png')

type Props = {
  /** Lamb touched down (Rive: `landed`). Fire the light haptic here. */
  onLanded?: () => void
  /** Sheet is up and Continue is tappable (Rive: `onboardingReady`). */
  onReady?: () => void
  /** Continue tapped (Rive: `continueTapped`): go to the first onboarding step. */
  onContinue: () => void
}

/** Static intro (web, and native when the Rive file fails to load): "landed" frame + the sheet. */
export function IntroStatic({ onLanded, onReady, onContinue }: Props) {
  const theme = useTheme()
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current) return
    fired.current = true
    onLanded?.()
    onReady?.()
  }, [onLanded, onReady])
  return (
    <View style={[styles.fill, { backgroundColor: theme.brand }]}>
      {/* RN gives an Image its asset's own width/height (390x844), which beat left/right/top/bottom: set the size outright. */}
      <Image testID="intro-scene" source={landed} style={styles.scene} resizeMode="cover" />
      <View style={styles.bottom}>
        <Sheet>
          <AppText variant="title" style={styles.center}>
            Meet your first lamb
          </AppText>
          <AppText variant="body" color="textSecondary" style={styles.center}>
            Read with friends and your flock grows.
          </AppText>
          <ChunkyButton label="Continue" onPress={onContinue} />
        </Sheet>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scene: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: space.lg },
  center: { textAlign: 'center' },
})
