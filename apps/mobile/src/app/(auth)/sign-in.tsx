import { useRef, useState } from 'react'
import { StyleSheet, View, type TextInputInstance } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui'
import {
  AuthScreen,
  BackButton,
  FadeIn,
  FormError,
  ScreenTitle,
  SwitchLink,
  TextField,
  isEmail,
} from '../../components/onboarding'
import { colors, spacing } from '../../theme/tokens'

type Errors = { email?: string; password?: string; form?: string }

function validate(email: string, password: string): Errors {
  const e: Errors = {}
  if (!isEmail(email)) e.email = 'Enter a valid email address.'
  if (!password) e.password = 'Enter your password.'
  return e
}

export default function SignIn() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<TextInputInstance>(null)

  const revalidate = (e = email, p = password) => submitted && setErrors(validate(e, p))

  async function signIn() {
    setSubmitted(true)
    const found = validate(email, password)
    setErrors(found)
    if (Object.keys(found).length) return

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    // On success the auth guard swaps to the signed-in app.
    if (error) setErrors({ form: error.message })
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <BackButton />
      </View>

      <AuthScreen
        footer={
          <>
            <Button label="Sign in" size="lg" loading={loading} onPress={signIn} />
            <SwitchLink prompt="New to Biblemates?" action="Create an account" onPress={() => router.replace('/')} />
          </>
        }
      >
        <FadeIn>
          <ScreenTitle eyebrow="Sign in" title="Welcome back." subtitle="Pick up where your circle left off." />
        </FadeIn>

        <FadeIn delay={120} style={styles.form}>
          <FormError message={errors.form} />
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
            value={password}
            onChangeText={(t) => {
              setPassword(t)
              revalidate(email, t)
            }}
            error={errors.password}
            secureToggle
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={signIn}
          />
        </FadeIn>
      </AuthScreen>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm },
  form: { gap: spacing.md },
})
