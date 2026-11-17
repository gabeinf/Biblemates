import { useRef, useState } from 'react'
import { StyleSheet, Text, View, type TextInputInstance } from 'react-native'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { supabase } from '../../../lib/supabase'
import { clearDraft, getDraft } from '../../../lib/onboarding-draft'
import { Button } from '../../../components/ui'
import {
  AuthScreen,
  FadeIn,
  FormError,
  MIN_PASSWORD,
  ScreenTitle,
  SwitchLink,
  TextField,
  isEmail,
} from '../../../components/onboarding'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

type Errors = { name?: string; email?: string; password?: string; form?: string }

function validate(name: string, email: string, password: string): Errors {
  const e: Errors = {}
  if (!name.trim()) e.name = 'Tell your circle what to call you.'
  if (!isEmail(email)) e.email = 'Enter a valid email address.'
  if (password.length < MIN_PASSWORD) e.password = `Use at least ${MIN_PASSWORD} characters.`
  return e
}

export default function CreateAccount() {
  const router = useRouter()
  const [name, setName] = useState(() => getDraft().displayName ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  const emailRef = useRef<TextInputInstance>(null)
  const passwordRef = useRef<TextInputInstance>(null)

  // After the first attempt, re-validate as the user types so errors clear.
  const revalidate = (n = name, e = email, p = password) => submitted && setErrors(validate(n, e, p))

  async function createAccount() {
    setSubmitted(true)
    const found = validate(name, email, password)
    setErrors(found)
    if (Object.keys(found).length) return

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    })
    setLoading(false)

    if (error) return setErrors({ form: error.message })
    // TODO(#23): write the draft's answers (circle, goal, stakes…) before clearing it.
    clearDraft()
    // With email confirmation on there's no session yet. Otherwise the auth
    // guard takes over and moves on to circle setup.
    if (!data.session) setConfirmSent(true)
  }

  if (confirmSent) {
    return (
      <AuthScreen
        footer={<Button label="Go to sign in" size="lg" onPress={() => router.replace('/sign-in')} />}
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
      </AuthScreen>
    )
  }

  return (
    <AuthScreen
      footer={
        <>
          <Button label="Create account" size="lg" loading={loading} onPress={createAccount} />
          <SwitchLink prompt="Already have an account?" action="Sign in" onPress={() => router.replace('/sign-in')} />
        </>
      }
    >
      <FadeIn>
        <ScreenTitle
          eyebrow="Create your account"
          title="Let’s get you set up."
          subtitle="Save your answers and start reading with your circle."
        />
      </FadeIn>

      <FadeIn delay={120} style={styles.form}>
        <FormError message={errors.form} />
        <TextField
          label="Your name"
          placeholder="How your circle will see you"
          value={name}
          onChangeText={(t) => {
            setName(t)
            revalidate(t)
          }}
          error={errors.name}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => emailRef.current?.focus()}
          maxLength={60}
        />
        <TextField
          ref={emailRef}
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={(t) => {
            setEmail(t)
            revalidate(name, t)
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
            revalidate(name, email, t)
          }}
          error={errors.password}
          secureToggle
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={createAccount}
        />
      </FadeIn>

      <Text style={styles.terms}>We’ll never post anything to your circle without you.</Text>
    </AuthScreen>
  )
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  terms: { fontFamily: typography.fontFamily.body, fontSize: 13, lineHeight: 18, color: colors.muted },
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
