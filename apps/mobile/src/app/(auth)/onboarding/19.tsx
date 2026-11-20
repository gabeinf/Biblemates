/**
 * 19 · Save progress. Creates the account and commits the draft in the same call.
 * See docs/specs/onboarding.md → "19 · Save progress (sign up)".
 */
import { useRef, useState } from 'react'
import { Pressable, StyleSheet, Text, View, type TextInputInstance } from 'react-native'
import { useRouter } from 'expo-router'
import * as AppleAuthentication from 'expo-apple-authentication'
import Ionicons from '@expo/vector-icons/Ionicons'
import { createScratchClient, supabase } from '../../../lib/supabase'
import { usePlacement } from '../../../lib/superwall'
import { clearDraft, getDraft } from '../../../lib/onboarding-draft'
import {
  PROVIDERS,
  onboardingPayload,
  signInWithAppleToken,
  signUpErrorMessage,
} from '../../../lib/onboarding-signup'
import { Button } from '../../../components/ui'
import {
  FadeIn,
  FormError,
  MIN_PASSWORD,
  ScreenTitle,
  TextField,
  isEmail,
} from '../../../components/onboarding'
import { StepHeading } from '../../../components/onboarding-step'
import { KeyboardScreen } from '../../../components/KeyboardScreen'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

const CODE = /^[A-Z0-9]{6}$/

type Errors = { email?: string; password?: string; code?: string; form?: string }

function validate(email: string, password: string, code: string | null): Errors {
  const e: Errors = {}
  if (!isEmail(email)) e.email = 'Enter a valid email address.'
  if (password.length < MIN_PASSWORD) e.password = `Use at least ${MIN_PASSWORD} characters.`
  if (code !== null && !CODE.test(code)) e.code = 'Invite codes are 6 letters or numbers.'
  return e
}

export default function SaveProgress() {
  const router = useRouter()
  // shortcut: temporary, to test the paywall; the spec wants it after the first reading instead.
  const { registerPlacement } = usePlacement()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [useEmail, setUseEmail] = useState(false)
  // Joiners already entered a code earlier; everyone else can add one here.
  const hasCode = !!getDraft().inviteCode
  const [codeOpen, setCodeOpen] = useState(false)
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)
  const passwordRef = useRef<TextInputInstance>(null)

  const enteredCode = codeOpen && code ? code : null
  // After the first attempt, re-validate as the user types so errors clear.
  const revalidate = (e = email, p = password, c = enteredCode) =>
    submitted && setErrors(validate(e, p, c))

  async function createAccount() {
    setSubmitted(true)
    const found = validate(email, password, enteredCode)
    setErrors(found)
    if (Object.keys(found).length) return

    const draft = getDraft()
    const answers = onboardingPayload(
      enteredCode ? { ...draft, path: 'join', inviteCode: enteredCode } : draft,
    )
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          ...(draft.displayName ? { display_name: draft.displayName } : {}),
          onboarding: answers,
        },
      },
    })
    setLoading(false)

    // Nothing was saved, so the draft stays and the user can fix it and retry here.
    if (error)
      return setErrors({ form: signUpErrorMessage(error.message, answers.path === 'join') })
    clearDraft()
    registerPlacement({ placement: 'onboarding_completed' }).catch(() => {})
    // With email confirmation on there's no session yet. Otherwise the auth guard
    // takes over and opens the app on the user's new circle.
    if (!data.session) setConfirmSent(true)
  }

  async function withApple() {
    setLoading(true)
    try {
      const { identityToken } = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      })
      if (!identityToken) throw new Error('Apple did not return a sign-in token.')
      const draft = getDraft()
      const message = await signInWithAppleToken(
        { scratch: createScratchClient(), main: supabase },
        identityToken,
        enteredCode ? { ...draft, path: 'join', inviteCode: enteredCode } : draft,
      )
      if (message) return setErrors({ form: message })
      clearDraft()
      registerPlacement({ placement: 'onboarding_completed' }).catch(() => {})
    } catch (e) {
      // The user closing Apple's sheet is not an error.
      if ((e as { code?: string }).code !== 'ERR_REQUEST_CANCELED')
        setErrors({ form: (e as Error).message })
    } finally {
      setLoading(false)
    }
  }

  if (confirmSent) {
    return (
      <KeyboardScreen
        footer={
          <Button label="Go to sign in" size="lg" onPress={() => router.replace('/sign-in')} />
        }
      >
        <FadeIn style={styles.confirm}>
          <View style={styles.confirmIcon}>
            <Ionicons name="mail-open-outline" size={30} color={colors.Gold} />
          </View>
          <ScreenTitle
            title="Check your inbox."
            subtitle={`We sent a confirmation link to ${email.trim()}. Open it, then come back and sign in.`}
          />
        </FadeIn>
      </KeyboardScreen>
    )
  }

  return (
    <KeyboardScreen
      footer={
        <>
          {useEmail ? (
            <Button label="Create account" size="lg" loading={loading} onPress={createAccount} />
          ) : null}
          <Text style={styles.note}>Your data stays private.</Text>
        </>
      }
    >
      {hasCode ? null : (
        <View style={styles.chipRow}>
          <Pressable
            onPress={() => setCodeOpen((o) => !o)}
            accessibilityRole="button"
            accessibilityLabel="Have an invite code?"
            accessibilityState={{ expanded: codeOpen }}
            style={styles.chip}
          >
            <Text style={styles.chipText}>Have an invite code?</Text>
          </Pressable>
        </View>
      )}
      {codeOpen ? (
        <TextField
          label="Invite code"
          placeholder="ABC123"
          value={code}
          onChangeText={(t) => {
            const next = t.toUpperCase()
            setCode(next)
            revalidate(email, password, next || null)
          }}
          error={errors.code}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
        />
      ) : null}

      <FadeIn style={styles.head}>
        <StepHeading title="Save your plan" align="center" />
      </FadeIn>

      <FadeIn delay={120} style={styles.buttons}>
        <FormError message={errors.form} />
        {PROVIDERS.apple ? (
          <Button
            label="Continue with Apple"
            variant="outline"
            size="lg"
            loading={loading}
            onPress={withApple}
          />
        ) : null}
        {useEmail ? (
          <View style={styles.form}>
            <TextField
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t)
                revalidate(t)
              }}
              error={errors.email}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              placeholder={`At least ${MIN_PASSWORD} characters`}
              value={password}
              onChangeText={(t) => {
                setPassword(t)
                revalidate(email, t)
              }}
              error={errors.password}
              secureToggle
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={createAccount}
            />
          </View>
        ) : (
          <Button label="Continue with email" size="lg" onPress={() => setUseEmail(true)} />
        )}
      </FadeIn>
    </KeyboardScreen>
  )
}

const styles = StyleSheet.create({
  chipRow: { alignItems: 'flex-end' },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.goldSoft,
  },
  chipText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Gold,
  },
  head: { paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  buttons: { gap: spacing.sm },
  form: { gap: spacing.md },
  note: {
    fontFamily: typography.fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    textAlign: 'center',
  },
  confirm: { gap: spacing.lg, paddingTop: spacing.xl },
  confirmIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.goldSoft,
  },
})
