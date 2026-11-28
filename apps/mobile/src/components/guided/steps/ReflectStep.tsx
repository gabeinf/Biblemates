import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useCircle, useCreateReflection } from '../../../hooks/queries'
import { SEEDS_PER_REFLECTION } from '../../../lib/seeds'
import { radius, space, type, useTheme } from '../../../theme'
import type { Visibility } from '../../../types/db'
import { AppText, ChunkyButton, SeedIcon } from '../../ui'
import type { StepProps } from './types'

/** Today's question: answer it (shared or private) or skip. Saving or skipping unlocks Continue. */
export function ReflectStep({ day, circleStudy, onReady }: StepProps) {
  const theme = useTheme()
  const circle = useCircle()
  const create = useCreateReflection()
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('circle')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    onReady(false)
  }, [onReady])

  // Same payload /reflect sends for mode=day.
  const save = () =>
    create.mutate(
      { circleId: circle.id, body, visibility, circleStudyId: circleStudy.id, dayNumber: day.day_number },
      {
        onSuccess: () => {
          setSaved(true)
          onReady(true)
        },
      },
    )

  return (
    <View style={styles.root}>
      <AppText variant="headline">{day.question}</AppText>
      <TextInput
        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
        multiline
        editable={!saved}
        placeholder="Write your answer…"
        placeholderTextColor={theme.textTertiary}
        accessibilityLabel="Your answer"
        value={body}
        onChangeText={setBody}
        maxLength={2000}
      />
      <View style={[styles.toggle, { backgroundColor: theme.surfaceSunken }]}>
        {(['circle', 'private'] as const).map((v) => (
          <Pressable
            key={v}
            disabled={saved}
            onPress={() => setVisibility(v)}
            accessibilityRole="radio"
            accessibilityState={{ selected: visibility === v }}
            style={[styles.toggleItem, visibility === v && { backgroundColor: theme.surface }]}
          >
            <AppText variant="callout">{v === 'circle' ? `Share with ${circle.name}` : 'Keep private'}</AppText>
          </Pressable>
        ))}
      </View>
      {visibility === 'circle' && (
        <View style={styles.hint}>
          <SeedIcon size={20} />
          <AppText variant="caption" color="textSecondary">{`+${SEEDS_PER_REFLECTION} seeds for sharing`}</AppText>
        </View>
      )}
      {create.error && (
        <AppText variant="caption" color="error">
          {create.error.message}
        </AppText>
      )}
      {saved ? (
        <AppText variant="callout" color="success">
          Saved
        </AppText>
      ) : (
        <>
          <ChunkyButton
            label={visibility === 'circle' ? 'Share' : 'Save note'}
            disabled={!body.trim()}
            loading={create.isPending}
            onPress={save}
          />
          <Pressable onPress={() => onReady(true)} accessibilityRole="button" hitSlop={12} style={styles.skip}>
            <AppText variant="callout" color="textSecondary">
              Skip, no bonus
            </AppText>
          </Pressable>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: space.md,
    ...type.body,
    textAlignVertical: 'top',
  },
  toggle: { flexDirection: 'row', borderRadius: radius.pill, padding: 3 },
  toggleItem: { flex: 1, paddingVertical: space.xs, borderRadius: radius.pill, alignItems: 'center' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  skip: { alignSelf: 'center', paddingVertical: space.xs },
})
