import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useCircle, useCreatePrayerRequest } from '../../hooks/queries'
import { Button, Muted } from '../../components/ui'
import { colors, radii, spacing, typography } from '../../theme/tokens'

export default function PrayerRequest() {
  const router = useRouter()
  const circle = useCircle()
  const create = useCreatePrayerRequest(circle.id)
  const [body, setBody] = useState('')

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Muted>Share what's on your heart with {circle.name}. They'll be able to let you know they prayed.</Muted>
        <TextInput
          style={styles.input}
          multiline
          autoFocus
          placeholder="Please pray for…"
          placeholderTextColor={colors.muted}
          value={body}
          onChangeText={setBody}
          maxLength={1000}
        />
        {create.error && <Text style={styles.error}>{create.error.message}</Text>}
        <Button
          label="Share request"
          disabled={!body.trim()}
          loading={create.isPending}
          onPress={() => create.mutate(body, { onSuccess: () => router.back() })}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  input: {
    minHeight: 140,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: typography.fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.Ink,
    textAlignVertical: 'top',
  },
  error: { color: colors.danger, fontFamily: typography.fontFamily.body },
})
