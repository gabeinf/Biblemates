/**
 * Screen body with a footer that rides the keyboard, for any step with a TextInput.
 * Follows CLAUDE.md → "Keyboard-aware layouts":
 * - the footer sits below the content (not absolutely positioned) in a KeyboardStickyView,
 *   so it tracks the keyboard frame by frame, including height changes from the suggestion
 *   bar or a keyboard switch, and drops the bottom safe-area inset while it's open;
 * - the content is a KeyboardAwareScrollView that keeps the focused input above the footer,
 *   reserving the footer's measured height plus spacing;
 * - taps on the footer work on the first try while the keyboard is open.
 */
import { useState, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { KeyboardAwareScrollView, KeyboardStickyView } from 'react-native-keyboard-controller'
import { colors, spacing } from '../theme/tokens'

export function KeyboardScreen({
  children,
  footer,
  centered,
}: {
  children: ReactNode
  footer: ReactNode
  /** Vertically centre short content (e.g. a single field). */
  centered?: boolean
}) {
  const insets = useSafeAreaInsets()
  const [footerHeight, setFooterHeight] = useState(0)

  return (
    <View style={styles.flex}>
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, centered && styles.centered]}
        bottomOffset={footerHeight + spacing.md}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardAwareScrollView>
      <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>
        <View style={styles.footer} onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}>
          {footer}
        </View>
      </KeyboardStickyView>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  centered: { justifyContent: 'center' },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.paper,
  },
})
