/**
 * Building blocks for the signed-out screens (welcome, onboarding, sign in).
 */
import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react'
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { colors, radii, spacing, typography } from '../theme/tokens'

/** Fades and lifts its children in on mount. Skipped when Reduce Motion is on. */
export function FadeIn({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let cancelled = false
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (cancelled) return
        if (reduce) return progress.setValue(1)
        Animated.timing(progress, { toValue: 1, duration: 450, delay, useNativeDriver: true }).start()
      })
    return () => {
      cancelled = true
    }
  }, [delay, progress])

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] })
  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>
}

/** Scrollable screen body with a footer pinned to the bottom that rides above the keyboard. */
export function AuthScreen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

export function ScreenTitle({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter()
  return (
    <Pressable
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={({ pressed }) => [styles.back, pressed && { opacity: 0.5 }]}
    >
      <Ionicons name="chevron-back" size={22} color={colors.Ink} />
    </Pressable>
  )
}

type TextFieldProps = TextInputProps & {
  label: string
  error?: string | null
  hint?: string
  ref?: Ref<TextInputInstance>
  /** Adds a show/hide toggle for passwords. */
  secureToggle?: boolean
}

export function TextField({ label, error, hint, ref, secureToggle, style, onFocus, onBlur, ...input }: TextFieldProps) {
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(true)

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.field, focused && styles.fieldFocused, !!error && styles.fieldError]}>
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={colors.inactive}
          selectionColor={colors.Gold}
          secureTextEntry={secureToggle ? hidden : input.secureTextEntry}
          onFocus={(e) => {
            setFocused(true)
            onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocused(false)
            onBlur?.(e)
          }}
          accessibilityLabel={label}
          {...input}
        />
        {secureToggle ? (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  )
}

/** A banner for errors that aren't tied to one field (e.g. "Invalid login credentials"). */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <View style={styles.formError} accessibilityLiveRegion="polite">
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={[styles.error, { flex: 1 }]}>{message}</Text>
    </View>
  )
}

/** "Already have an account? Sign in" style line. */
export function SwitchLink({ prompt, action, onPress }: { prompt: string; action: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="link" style={styles.switch}>
      <Text style={styles.switchText}>
        {prompt} <Text style={styles.switchAction}>{action}</Text>
      </Text>
    </Pressable>
  )
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
export const MIN_PASSWORD = 6

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  body: { gap: spacing.lg, paddingTop: spacing.md },
  footer: { gap: spacing.md, paddingTop: spacing.xl },
  eyebrow: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.Gold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: { fontFamily: typography.fontFamily.display, fontSize: 40, lineHeight: 44, color: colors.Ink },
  subtitle: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.bodySmall, lineHeight: 24, color: colors.muted },
  back: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.Ink },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldFocused: { borderColor: colors.Gold, borderWidth: 1.5 },
  fieldError: { borderColor: colors.danger },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  hint: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.muted },
  error: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.danger },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: '#A3402E14',
  },
  switch: { alignSelf: 'center', paddingVertical: spacing.xs },
  switchText: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.muted },
  switchAction: { color: colors.Gold, textDecorationLine: 'underline' },
})
