import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCircle, useCircleStudy, useCreateReflection } from '../../hooks/queries'
import { currentDayNumber } from '../../lib/study-day'
import { formatRef } from '../../constants/books'
import { Button, Eyebrow, Muted } from '../../components/ui'
import { Bone } from '../../components/Skeleton'
import { colors, radii, spacing, typography } from '../../theme/tokens'
import type { Visibility } from '../../types/db'

/**
 * Compose a reflection.
 *  /reflect?mode=day[&day=3]                      → answer the study question
 *  /reflect?mode=verse&book=JHN&chapter=15&verse=4[&visibility=private]
 */
export default function Reflect() {
  const router = useRouter()
  const params = useLocalSearchParams<{ mode: 'day' | 'verse'; day?: string; book?: string; chapter?: string; verse?: string; visibility?: Visibility }>()
  const circle = useCircle()
  const cs = useCircleStudy(circle.id)
  const create = useCreateReflection()

  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<Visibility>(params.visibility ?? 'circle')

  const isDay = params.mode !== 'verse'
  const dayNumber = isDay && cs.data ? (params.day ? Number(params.day) : currentDayNumber(cs.data)) : undefined
  const day = cs.data?.study.days.find((d) => d.day_number === dayNumber)

  const heading = isDay
    ? day?.question
    : formatRef({ bookId: params.book!, chapter: Number(params.chapter), verseStart: Number(params.verse) })

  const submit = () => {
    create.mutate(
      isDay
        ? { circleId: circle.id, body, visibility, circleStudyId: cs.data!.id, dayNumber }
        : {
            circleId: circle.id,
            body,
            visibility,
            bookId: params.book,
            chapter: Number(params.chapter),
            verse: Number(params.verse),
          },
      { onSuccess: () => router.back() },
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Eyebrow>{isDay ? `Day ${dayNumber ?? ''} · ${day?.title ?? ''}` : 'Reflect on this verse'}</Eyebrow>
        {heading ? <Text style={styles.heading}>{heading}</Text> : <Bone width="85%" height={26} />}

        <TextInput
          style={styles.input}
          multiline
          autoFocus
          placeholder={isDay ? 'Write your answer…' : 'What is this verse saying to you?'}
          placeholderTextColor={colors.muted}
          value={body}
          onChangeText={setBody}
          maxLength={2000}
        />

        <View style={styles.toggle}>
          {(['circle', 'private'] as const).map((v) => (
            <Pressable key={v} style={[styles.toggleItem, visibility === v && styles.toggleActive]} onPress={() => setVisibility(v)}>
              <Text style={[styles.toggleText, visibility === v && { color: colors.surface }]}>
                {v === 'circle' ? `Share with ${circle.name}` : 'Keep private'}
              </Text>
            </Pressable>
          ))}
        </View>
        <Muted>
          {visibility === 'circle'
            ? 'Your circle will see this and can encourage you.'
            : 'Only you can see this note.'}
        </Muted>

        {create.error && <Text style={styles.error}>{create.error.message}</Text>}
        <Button label={visibility === 'circle' ? 'Share' : 'Save note'} disabled={!body.trim() || (isDay && !cs.data)} loading={create.isPending} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  heading: { fontFamily: typography.fontFamily.display, fontSize: 24, lineHeight: 30, color: colors.Ink },
  input: {
    minHeight: 160,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: typography.fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
    color: colors.Ink,
    textAlignVertical: 'top',
  },
  toggle: { flexDirection: 'row', backgroundColor: colors.Mat, borderRadius: radii.full, padding: 3 },
  toggleItem: { flex: 1, paddingVertical: spacing.xs, borderRadius: radii.full, alignItems: 'center' },
  toggleActive: { backgroundColor: colors.Gold },
  toggleText: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.Ink },
  error: { color: colors.danger, fontFamily: typography.fontFamily.body },
})
