import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthContext, useUserId } from '../../hooks/use-auth-context'
import { qk, useCircle } from '../../hooks/queries'
import { removeAvatar, updateProfile, uploadAvatar } from '../../services/profile'
import { Avatar, Button, Muted } from '../../components/ui'
import { colors, radii, spacing, typography } from '../../theme/tokens'

export default function EditProfile() {
  const router = useRouter()
  const qc = useQueryClient()
  const userId = useUserId()
  const circle = useCircle()
  const { profile, refreshProfile } = useAuthContext()

  const [name, setName] = useState(profile?.display_name ?? '')
  // undefined = unchanged, null = removed, string = new local image
  const [photo, setPhoto] = useState<string | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  const shownPhoto = photo === undefined ? profile?.avatar_url : photo

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    })
    if (!result.canceled) setPhoto(result.assets[0].uri)
  }

  const photoOptions = () => {
    if (!shownPhoto) return pickPhoto()
    Alert.alert('Profile photo', undefined, [
      { text: 'Choose new photo', onPress: pickPhoto },
      { text: 'Remove photo', style: 'destructive', onPress: () => setPhoto(null) },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const dirty = name.trim() !== (profile?.display_name ?? '') || photo !== undefined

  const save = async () => {
    if (!name.trim()) return Alert.alert('Name required', 'Your circle needs to know who you are.')
    setSaving(true)
    try {
      const patch: { display_name: string; avatar_url?: string | null } = { display_name: name.trim() }
      if (typeof photo === 'string') patch.avatar_url = await uploadAvatar(userId, photo)
      if (photo === null) {
        await removeAvatar(userId)
        patch.avatar_url = null
      }
      await updateProfile(userId, patch)
      await refreshProfile()
      qc.invalidateQueries({ queryKey: qk.members(circle.id) })
      router.back()
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.photo} onPress={photoOptions}>
          <Avatar name={name || profile?.display_name} uri={shownPhoto} size={120} />
          <Text style={styles.link}>{shownPhoto ? 'Change photo' : 'Add a photo'}</Text>
        </Pressable>

        <View style={{ gap: spacing.xs }}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            maxLength={40}
            autoCapitalize="words"
            returnKeyType="done"
          />
          <Muted>This is how you appear to your circle.</Muted>
        </View>

        <Button label="Save" loading={saving} disabled={!dirty} onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg },
  photo: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  link: { fontFamily: typography.fontFamily.body, fontSize: 16, color: colors.Gold },
  label: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.caption, color: colors.muted },
  input: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    fontFamily: typography.fontFamily.body,
    fontSize: 16,
    color: colors.Ink,
  },
})
