import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useCreateCircle, useJoinCircle } from '../../hooks/queries'
import { useAuthContext } from '../../hooks/use-auth-context'
import { Button, Card, Eyebrow, LambView, Muted } from '../../components/ui'
import { colors, radii, spacing, typography } from '../../theme/tokens'
import { firstName } from '../../lib/format'

export default function CircleSetup() {
  const { profile } = useAuthContext()
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const create = useCreateCircle()
  const join = useJoinCircle()
  const error = create.error?.message ?? join.error?.message

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        {mode === 'choose' && <LambView view="front" size={120} style={{ alignSelf: 'center' }} />}
        <Eyebrow>Welcome, {firstName(profile?.display_name)}</Eyebrow>
        <Text style={styles.title}>{'Grow together,\nevery day.'}</Text>
        <Muted>Biblemates works best with a small circle — a partner, your family, or a few friends reading the same passage each day.</Muted>

        {mode === 'choose' && (
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            <Button label="Start a new circle" onPress={() => setMode('create')} />
            <Button label="I have an invite code" variant="outline" onPress={() => setMode('join')} />
          </View>
        )}

        {mode === 'create' && (
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={styles.label}>Circle name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Smith Family, Tuesday Group"
              placeholderTextColor={colors.inactive}
              value={name}
              onChangeText={setName}
              maxLength={60}
              autoFocus
            />
            <Button label="Create circle" loading={create.isPending} disabled={!name.trim()} onPress={() => create.mutate(name)} />
            <Button label="Back" variant="ghost" onPress={() => setMode('choose')} />
          </Card>
        )}

        {mode === 'join' && (
          <Card style={{ marginTop: spacing.lg }}>
            <Text style={styles.label}>Invite code</Text>
            <TextInput
              style={[styles.input, styles.code]}
              placeholder="ABC123"
              placeholderTextColor={colors.inactive}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              autoFocus
            />
            <Button label="Join circle" loading={join.isPending} disabled={code.trim().length < 6} onPress={() => join.mutate(code)} />
            <Button label="Back" variant="ghost" onPress={() => setMode('choose')} />
          </Card>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  body: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, gap: spacing.md },
  title: { fontFamily: typography.fontFamily.display, fontSize: 44, lineHeight: 48, color: colors.Ink },
  label: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.caption, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  code: { letterSpacing: 6, fontSize: typography.fontSize.subTitle, textAlign: 'center' },
  error: { color: colors.danger, fontFamily: typography.fontFamily.body },
})
