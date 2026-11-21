import type { PropsWithChildren, ReactNode } from 'react'
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { space, useTheme } from '../../theme'
import { AppText } from './AppText'

/** Canvas background, 24pt screen padding, optional title, optional scroll. Footers: use KeyboardScreen for input screens. */
export function ScreenScaffold({
  title,
  scroll = true,
  footer,
  style,
  children,
}: PropsWithChildren<{ title?: string; scroll?: boolean; footer?: ReactNode; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme()
  const body = (
    <>
      {title ? <AppText variant="title">{title}</AppText> : null}
      {children}
    </>
  )
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: theme.bg }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, style]} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, style]}>{body}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: space.lg, gap: space.md },
  footer: { paddingHorizontal: space.lg, paddingBottom: space.md },
})
