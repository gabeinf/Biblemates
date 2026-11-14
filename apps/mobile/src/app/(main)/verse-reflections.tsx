import { ScrollView, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useChapter, useChapterReflections, useCircle, useMembers } from '../../hooks/queries'
import { formatRef } from '../../constants/books'
import ReflectionCard from '../../components/ReflectionCard'
import { Button, Card, Eyebrow, Muted } from '../../components/ui'
import { Lines, RowSkeleton } from '../../components/Skeleton'
import { colors, spacing, typography } from '../../theme/tokens'
import { Text } from 'react-native'

export default function VerseReflections() {
  const router = useRouter()
  const { book, chapter, verse } = useLocalSearchParams<{ book: string; chapter: string; verse: string }>()
  const circle = useCircle()
  const members = useMembers(circle.id)
  const reflections = useChapterReflections(circle.id, book, Number(chapter))
  const text = useChapter('web', book, Number(chapter))

  const verseNum = Number(verse)
  const list = (reflections.data ?? []).filter((r) => r.verse === verseNum)
  const verseText = text.data?.verses.find((v) => v.verse === verseNum)?.text

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Eyebrow>{formatRef({ bookId: book, chapter: Number(chapter), verseStart: verseNum })}</Eyebrow>
      {verseText ? <Text style={styles.verse}>{verseText}</Text> : text.isPending ? <Lines count={2} height={16} /> : null}

      <Card style={{ gap: 0 }}>
        {reflections.isPending && <RowSkeleton count={2} avatar={36} />}
        {list.map((r) => (
          <ReflectionCard key={r.id} reflection={r} members={members.data ?? []} />
        ))}
        {reflections.isSuccess && !list.length && <Muted>No reflections on this verse yet.</Muted>}
      </Card>

      <Button
        label="Add your reflection"
        variant="outline"
        onPress={() => router.push({ pathname: '/reflect', params: { mode: 'verse', book, chapter, verse } })}
      />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  verse: { fontFamily: typography.fontFamily.bodyItalic, fontSize: 18, lineHeight: 28, color: colors.Ink },
})
