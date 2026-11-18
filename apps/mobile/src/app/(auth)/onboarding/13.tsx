/**
 * 13 · Name. What the circle will call them.
 * See docs/specs/onboarding.md → "13 · Name".
 *
 * Keyboard: the button sits right under the field, not in a bottom footer, so nothing is
 * bottom-anchored. The KeyboardAwareScrollView keeps the field *and* the button below it
 * above the keyboard (bottomOffset = measured button block + spacing), and follows every
 * keyboard height change (suggestion bar, keyboard switch).
 */
import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { getDraft, updateDraft } from '../../../lib/onboarding-draft'
import { DISPLAY_NAME_MAX, cleanDisplayName } from '../../../lib/display-name'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

/** Gap above the button plus its minimum height. */
const BELOW_SEED = spacing.xl + spacing.xxl

export default function Name() {
  const { goNext } = useOnboardingNav()
  const [name, setName] = useState(() => getDraft().displayName ?? '')
  const [focused, setFocused] = useState(false)
  // Height of the block under the field (its top padding is the gap, then the button), so
  // the button stays above the keyboard too. Seeded with the button's height so the first
  // keyboard frame (autofocus) already leaves room before layout lands.
  const [belowField, setBelowField] = useState<number>(BELOW_SEED)

  const clean = cleanDisplayName(name)

  const onChangeText = (text: string) => {
    setName(text)
    // Saved as they type, so going back and forward keeps it.
    updateDraft({ displayName: cleanDisplayName(text) ?? undefined })
  }

  const submit = () => {
    if (clean) goNext({ displayName: clean })
  }

  return (
    <KeyboardAwareScrollView
      testID="name-scroll"
      style={styles.flex}
      contentContainerStyle={styles.content}
      bottomOffset={belowField + spacing.md}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <FadeIn style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          What should your circle call you?
        </Text>
        <Text style={styles.hint}>A first name or nickname is perfect.</Text>
      </FadeIn>

      {/* Not wrapped in FadeIn: the field must hold still while autofocus opens the keyboard. */}
      <View>
        <TextInput
          value={name}
          onChangeText={onChangeText}
          onSubmitEditing={submit}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel="Your name"
          placeholder="Your name"
          placeholderTextColor={colors.inactive}
          selectionColor={colors.Gold}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="done"
          submitBehavior="submit"
          maxLength={DISPLAY_NAME_MAX}
          style={[styles.input, focused && styles.inputFocused]}
        />
        <View
          testID="below-field"
          onLayout={(e) => setBelowField(e.nativeEvent.layout.height)}
          style={styles.below}
        >
          <Button label="Continue" disabled={!clean} onPress={submit} style={styles.pill} />
        </View>
      </View>
    </KeyboardAwareScrollView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, gap: spacing.xxl },
  head: { gap: spacing.xs, alignItems: 'center' },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    color: colors.Ink,
    textAlign: 'center',
  },
  hint: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.muted,
    textAlign: 'center',
  },
  input: {
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.subTitle,
    color: colors.Ink,
    textAlign: 'center',
  },
  inputFocused: { borderBottomWidth: 1.5, borderBottomColor: colors.Gold },
  // The gap lives inside the measured block, so bottomOffset covers it.
  below: { alignItems: 'center', paddingTop: spacing.xl },
  pill: { borderRadius: radii.full, paddingHorizontal: spacing.xxl, minHeight: spacing.xxl },
})
