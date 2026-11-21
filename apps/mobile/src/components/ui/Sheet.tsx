import type { PropsWithChildren } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, space, useTheme } from '../../theme'

/** Bottom-anchored panel with a 28pt top radius (onboarding sheet, Today card). Respects the bottom safe area. */
export function Sheet({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.sheet, { backgroundColor: theme.bg, paddingBottom: Math.max(insets.bottom, space.md) }, style]}>{children}</View>
  )
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: space.lg, paddingTop: space.lg, gap: space.md },
})
