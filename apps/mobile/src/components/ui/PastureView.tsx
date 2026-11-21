import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { pasture, useTheme } from '../../theme'
import { AppText } from './AppText'

const side = require('../../../assets/characters/lamb-side-idle.png')
// Feet positions (fractions of the scene) for up to 6 placeholder lambs; Rive wandering replaces this.
const SLOTS = [
  [0.18, 0.78], [0.42, 0.64], [0.7, 0.7], [0.55, 0.88], [0.28, 0.93], [0.8, 0.92],
] as const

/** Placeholder pasture: sky gradient + hills + path + pond + static lambs. Header-height art at 390:560. */
export function PastureView({ lambCount = 0, style, children }: { lambCount?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode }) {
  const { scene } = useTheme()
  const shown = Math.min(lambCount, SLOTS.length)
  const extra = lambCount - shown
  return (
    <View
      accessible
      accessibilityLabel={`Your flock, ${lambCount} ${lambCount === 1 ? 'lamb' : 'lambs'}`}
      style={[{ aspectRatio: pasture.artboard.width / pasture.artboard.height, width: '100%', overflow: 'hidden' }, style]}
    >
      <LinearGradient colors={scene.sky} style={StyleSheet.absoluteFill} />
      <View style={[styles.sun, { backgroundColor: scene.sun }]} />
      <View style={[styles.hill, { backgroundColor: scene.hillBack, top: '34%', left: '-30%', width: '120%', height: '60%' }]} />
      <View style={[styles.hill, { backgroundColor: scene.hillMid, top: '46%', left: '-10%', width: '130%', height: '70%' }]} />
      <View style={[styles.hill, { backgroundColor: scene.hillFront, top: '66%', left: '-20%', width: '140%', height: '60%' }]} />
      <View style={[styles.hill, { backgroundColor: scene.pond, top: '74%', left: '58%', width: '34%', height: '9%' }]} />
      {SLOTS.slice(0, shown).map(([x, y], i) => (
        <Image key={i} source={side} resizeMode="contain" style={[styles.lamb, { left: `${x * 100 - 12}%`, top: `${y * 100 - 18}%` }, i % 2 ? { transform: [{ scaleX: -1 }] } : null]} />
      ))}
      {extra > 0 && (
        <View style={styles.more}>
          <AppText variant="caption" color="onPrimary">{`+${extra}`}</AppText>
        </View>
      )}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  sun: { position: 'absolute', top: '10%', right: '12%', width: 72, height: 72, borderRadius: 36 },
  hill: { position: 'absolute', borderRadius: 9999 },
  lamb: { position: 'absolute', width: '24%', height: '18%' },
  more: { position: 'absolute', right: 12, bottom: 12 },
})
