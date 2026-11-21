import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import { control, motion, space, useTheme } from '../../theme'
import { AppText } from './AppText'
import { haptic } from './haptics'

export type ChunkyVariant = 'primary' | 'secondary' | 'reward'

type Props = {
  label: string
  onPress?: () => void
  variant?: ChunkyVariant
  loading?: boolean
  disabled?: boolean
  icon?: ReactNode
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
}

/** 56h button with a 4px lip. Press: the face drops into the lip in 120ms, then springs back. */
export function ChunkyButton({ label, onPress, variant = 'primary', loading, disabled, icon, style, accessibilityLabel }: Props) {
  const theme = useTheme()
  const reduce = useReducedMotion()
  const y = useSharedValue(0)
  const off = !!(disabled || loading)

  const face = off ? theme.disabledFill : { primary: theme.primary, secondary: theme.surface, reward: theme.reward }[variant]
  const lip = off ? theme.border : { primary: theme.primaryLip, secondary: theme.border, reward: theme.rewardLip }[variant]
  const ink = off ? 'disabledText' : { primary: 'onPrimary', secondary: 'text', reward: 'rewardInk' }[variant]
  const inkRole = ink as 'disabledText' | 'onPrimary' | 'text' | 'rewardInk'

  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }))
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (off) return
        haptic.tap()
        y.set(reduce ? 0 : withTiming(control.lip, { duration: motion.duration.press }))
      }}
      onPressOut={() => {
        y.set(reduce ? 0 : withSpring(0, motion.spring.snap))
      }}
      disabled={off}
      hitSlop={control.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: off, busy: !!loading }}
      style={[styles.wrap, style]}
    >
      <View style={[styles.lip, { backgroundColor: lip }]} />
      <Animated.View style={[styles.face, { backgroundColor: face, borderColor: variant === 'secondary' ? theme.border : face }, anim]}>
        {loading ? (
          <ActivityIndicator color={theme[inkRole] as string} />
        ) : (
          <View style={styles.row}>
            {icon}
            <AppText variant="button" color={inkRole}>
              {label}
            </AppText>
          </View>
        )}
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: { height: control.height + control.lip, alignSelf: 'stretch' },
  lip: { position: 'absolute', left: 0, right: 0, bottom: 0, height: control.height, borderRadius: control.radius },
  face: {
    height: control.height,
    borderRadius: control.radius,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
})
