import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { colors } from '../theme/tokens'

type Props = { position: number; total: number; fraction: number }

/** Onboarding progress: a single track that fills to `fraction`. */
export default function ProgressBar({ position, total, fraction }: Props) {
  const fill = useRef(new Animated.Value(fraction)).current
  useEffect(() => {
    Animated.timing(fill, { toValue: fraction, duration: 350, useNativeDriver: false }).start()
  }, [fraction, fill])

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${position} of ${total}`}
      accessibilityValue={{ min: 1, max: total, now: position }}
    >
      <Animated.View
        style={[
          styles.fill,
          { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inactive,
    overflow: 'hidden',
  },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.Gold },
})
