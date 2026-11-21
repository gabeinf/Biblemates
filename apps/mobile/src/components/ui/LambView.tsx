import { useImperativeHandle, type Ref } from 'react'
import { Image, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import { motion } from '../../theme'

const art = {
  front: require('../../../assets/characters/lamb-front.png'),
  sideIdle: require('../../../assets/characters/lamb-side-idle.png'),
  sideWalk: require('../../../assets/characters/lamb-side-walk.png'),
}

export type LambHandle = { pet: () => void }
type Props = {
  view: 'front' | 'side'
  walking?: boolean
  /** Imperative `pet()`. The Rive `pet` trigger replaces the hop in S4; call sites stay. */
  petRef?: Ref<LambHandle>
  /** Height in pt (width follows the art's aspect). */
  size?: number
  style?: StyleProp<ViewStyle>
}

/** Placeholder lamb: static art + a hop for `pet`. Stable props so Rive can swap the internals. */
export function LambView({ view, walking, petRef, size = view === 'front' ? 200 : 96, style }: Props) {
  const y = useSharedValue(0)
  useImperativeHandle(petRef, () => ({
    pet: () => {
      y.value = withSequence(withTiming(-12, { duration: motion.duration.small }), withSpring(0, motion.spring.reward))
    },
  }))
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  const source = view === 'front' ? art.front : walking ? art.sideWalk : art.sideIdle
  return (
    <Animated.View style={[anim, style]} accessible accessibilityRole="image" accessibilityLabel="A lamb">
      <Image source={source} style={{ height: size, width: view === 'front' ? size : size * 1.46 }} resizeMode="contain" />
    </Animated.View>
  )
}
