/**
 * J · Join with code. An invited member enters their circle's code (or pastes the link).
 * The code is only format-checked here; join_circle runs after sign-up in 19.
 * See docs/specs/onboarding.md → "J · Join with code".
 */
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { Button } from '../../../components/ui'
import { FadeIn, TextField } from '../../../components/onboarding'
import { KeyboardScreen } from '../../../components/KeyboardScreen'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { getDraft } from '../../../lib/onboarding-draft'
import {
  INVITE_CODE_LENGTH,
  extractInviteCode,
  hasNonHex,
  isInviteCode,
} from '../../../lib/invite-code'
import { colors, spacing, typography } from '../../../theme/tokens'

const NO_CODE = 'We couldn’t find a code in that. Try just the 6 characters.'
const BAD_FORMAT = `Codes are ${INVITE_CODE_LENGTH} characters: numbers 0–9 and letters A–F.`

export default function JoinWithCode() {
  const { goNext } = useOnboardingNav()
  const params = useLocalSearchParams<{ code?: string }>()
  const [code, setCode] = useState(() => {
    // A deep link (/onboarding/join?code=…) wins over a code typed earlier.
    const fromLink = typeof params.code === 'string' ? extractInviteCode(params.code) : null
    return fromLink ?? getDraft().inviteCode ?? ''
  })
  const [pasteFailed, setPasteFailed] = useState(false)
  const [touched, setTouched] = useState(false)

  const valid = isInviteCode(code)
  // A letter past F is wrong right away; a short code only once they've left the field.
  const badFormat = hasNonHex(code) || (touched && code.length > 0 && !valid)
  const error = pasteFailed ? NO_CODE : badFormat ? BAD_FORMAT : null

  const onChangeText = (text: string) => {
    const next = extractInviteCode(text)
    setPasteFailed(next === null)
    if (next !== null) setCode(next)
  }

  const submit = () => {
    if (!valid || pasteFailed) return setTouched(true)
    goNext({ inviteCode: code, path: 'join' })
  }

  return (
    <KeyboardScreen
      footer={
        <FadeIn delay={120}>
          <Button label="Join circle" size="lg" disabled={!valid || pasteFailed} onPress={submit} />
        </FadeIn>
      }
    >
      <FadeIn style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Join your circle
        </Text>
        <Text style={styles.subtitle}>
          Enter the code from your invite. Pasting the whole link or message works too.
        </Text>
      </FadeIn>

      <FadeIn delay={60}>
        <View style={styles.field}>
          <TextField
            label="Invite code"
            value={code}
            onChangeText={onChangeText}
            onBlur={() => setTouched(true)}
            onSubmitEditing={submit}
            placeholder="A1B2C3"
            autoFocus
            autoCapitalize="characters"
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            textContentType="none"
            returnKeyType="go"
            style={styles.input}
            error={error}
            hint={`${code.length}/${INVITE_CODE_LENGTH} · numbers 0–9 and letters A–F`}
          />
        </View>
      </FadeIn>
    </KeyboardScreen>
  )
}

const styles = StyleSheet.create({
  head: { gap: spacing.sm, alignItems: 'center' },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    color: colors.Ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.muted,
    textAlign: 'center',
  },
  field: { paddingTop: spacing.md },
  input: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.subTitle,
    letterSpacing: spacing.xs,
    textAlign: 'center',
  },
})
