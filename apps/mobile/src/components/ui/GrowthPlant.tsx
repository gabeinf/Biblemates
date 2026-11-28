import Ionicons from '@expo/vector-icons/Ionicons'
import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated'
import { motion, useTheme } from '../../theme'

type IconName = keyof typeof Ionicons.glyphMap

/** Placeholder art per species: the full-grown icon. Real art swaps in behind the same props. */
export const GROWTH_SPECIES = {
  olive: 'leaf',
  lily: 'flower',
  rose: 'rose',
  cedar: 'earth',
} as const satisfies Record<string, IconName>

export type GrowthSpeciesId = keyof typeof GROWTH_SPECIES
export type GrowthStage = 0 | 1 | 2 | 3 | 'withered' | 'empty'

type Props = { species: GrowthSpeciesId; stage: GrowthStage; size?: number }

const STAGE_ICON: Record<0 | 1 | 2, IconName> = { 0: 'ellipse', 1: 'leaf-outline', 2: 'leaf' }

/** Mound + plant. A stage change pops the plant with a small spring (skipped under reduced motion). */
export function GrowthPlant({ species, stage, size = 64 }: Props) {
  const theme = useTheme()
  const reduce = useReducedMotion()
  const scale = useSharedValue(1)

  useEffect(() => {
    if (reduce) return
    scale.set(0.7)
    scale.set(withSpring(1, motion.spring.snap))
  }, [stage, reduce, scale])

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  const withered = stage === 'withered'
  const icon: IconName | null = stage === 'empty' ? null : withered ? 'leaf-outline' : stage === 3 ? GROWTH_SPECIES[species] : STAGE_ICON[stage]
  const label = `${species}, ${typeof stage === 'number' ? `stage ${stage}` : stage}`

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      {icon && (
        <Animated.View style={[{ marginBottom: -size * 0.12, transform: withered ? [{ rotate: '35deg' }] : [] }, anim]}>
          <Ionicons
            name={icon}
            size={size * (stage === 0 ? 0.2 : 0.6)}
            color={withered ? theme.textSecondary : stage === 3 ? theme.success : theme.primary}
          />
        </Animated.View>
      )}
      <View style={{ width: size * 0.8, height: size * 0.22, borderRadius: size, backgroundColor: theme.surfaceSunken, borderColor: theme.border, borderWidth: 1 }} />
    </View>
  )
}
