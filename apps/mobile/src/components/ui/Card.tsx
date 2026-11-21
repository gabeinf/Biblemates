import type { PropsWithChildren } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { radius, shadow, space, useTheme } from '../../theme'

export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme()
  return <View style={[styles.card, shadow.card, { shadowColor: theme.outline, backgroundColor: theme.surface, borderColor: theme.border }, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, borderWidth: StyleSheet.hairlineWidth, padding: space.md, gap: space.xs },
})
