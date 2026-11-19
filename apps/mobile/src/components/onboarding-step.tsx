/**
 * Layout for onboarding steps 03+ that sit under the shared header (back + progress).
 * The body scrolls, and the footer (primary button) stays pinned to the bottom.
 * The onboarding layout's SafeAreaView already pads the bottom inset.
 */
import type { ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { FadeIn } from './onboarding'
import { colors, spacing, typography } from '../theme/tokens'

export function StepScreen({
  children,
  footer,
  fade = false,
}: {
  children: ReactNode
  footer: ReactNode
  /** Fades the scrolling content out just above the footer (long lists, like 05). */
  fade?: boolean
}) {
  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, fade && styles.contentFaded]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
      <FadeIn delay={240} style={styles.footer}>
        {fade ? (
          <LinearGradient
            colors={[`${colors.paper}00`, colors.paper]}
            style={styles.fade}
            pointerEvents="none"
          />
        ) : null}
        {footer}
      </FadeIn>
    </View>
  )
}

/**
 * Serif step headline. `muted` adds a second line in a quieter tone (the two-tone
 * headlines on 04 and 09).
 */
export function StepHeading({
  title,
  muted,
  subtitle,
  align = 'left',
}: {
  title: string
  muted?: string
  subtitle?: string
  align?: 'left' | 'center'
}) {
  return (
    <View style={styles.heading}>
      <Text style={[styles.title, { textAlign: align }]} accessibilityRole="header">
        {title}
        {muted ? <Text style={styles.titleMuted}>{`\n${muted}`}</Text> : null}
      </Text>
      {subtitle ? <Text style={[styles.subtitle, { textAlign: align }]}>{subtitle}</Text> : null}
    </View>
  )
}

const FADE_HEIGHT = spacing.xxl

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.paper },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  // Room for the last item to scroll clear of the fade.
  contentFaded: { paddingBottom: FADE_HEIGHT },
  fade: { position: 'absolute', left: 0, right: 0, bottom: '100%', height: FADE_HEIGHT },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  heading: { gap: spacing.xs },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    lineHeight: Math.round(typography.fontSize.title * 1.15),
    color: colors.Ink,
  },
  titleMuted: { color: colors.muted },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    lineHeight: Math.round(typography.fontSize.bodySmall * 1.5),
    color: colors.muted,
  },
})