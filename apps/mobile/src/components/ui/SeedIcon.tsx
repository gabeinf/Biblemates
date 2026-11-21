import { Image, type ImageStyle, type StyleProp } from 'react-native'

const seed = require('../../../assets/characters/seed.png')

/** Placeholder: static art. Rive `Seed` replaces the internals (S4); the `earn` trigger will hang off a ref. */
export function SeedIcon({ size = 24, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={seed} style={[{ width: size, height: size }, style]} resizeMode="contain" accessibilityLabel="Seed" />
}
