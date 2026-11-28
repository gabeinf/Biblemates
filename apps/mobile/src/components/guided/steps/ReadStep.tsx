import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { formatRef } from '../../../constants/books'
import { useChapter } from '../../../hooks/queries'
import { getLastTranslation } from '../../../lib/reader-prefs'
import { radius, space, useTheme } from '../../../theme'
import { AppText, Chibi, ChunkyButton } from '../../ui'
import type { StepProps } from './types'

const END_SLACK = 24

/** Today's passage, inline. Continue unlocks once the user scrolls to the end (or it all fits). */
export function ReadStep({ day, onReady }: StepProps) {
  const theme = useTheme()
  const router = useRouter()
  const { height } = useWindowDimensions()
  const chapter = useChapter(getLastTranslation(), day.book_id, day.chapter)
  const [box, setBox] = useState(0)
  const [content, setContent] = useState(0)

  const start = day.verse_start ?? 1
  const end = day.verse_end ?? day.verse_start ?? Infinity
  const verses = (chapter.data?.verses ?? []).filter((v) => v.verse >= start && v.verse <= end)
  // An error or an empty range must not strand the user: Bible tab link remains.
  const fits =
    chapter.isError ||
    (chapter.isSuccess && verses.length === 0) ||
    (verses.length > 0 && box > 0 && content <= box + END_SLACK)

  useEffect(() => {
    onReady(fits)
  }, [fits, onReady])

  const openBible = () =>
    router.navigate({
      pathname: '/bible',
      params: { book: day.book_id, chapter: String(day.chapter), verse: String(day.verse_start ?? '') },
    })

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Chibi mood="reading" size={64} />
        <View style={styles.flex}>
          <AppText variant="headline">
            {formatRef({
              bookId: day.book_id,
              chapter: day.chapter,
              verseStart: day.verse_start,
              verseEnd: day.verse_end,
            })}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {day.read_minutes} min read
          </AppText>
        </View>
      </View>
      {chapter.isError ? (
        <AppText variant="body" color="textSecondary">
          Couldn’t load the passage. Open it in the Bible tab to keep going.
        </AppText>
      ) : (
        <ScrollView
          testID="passage"
          nestedScrollEnabled
          style={[styles.passage, { maxHeight: height * 0.5, backgroundColor: theme.surface, borderColor: theme.border }]}
          contentContainerStyle={styles.passageContent}
          onLayout={(e) => setBox(e.nativeEvent.layout.height)}
          onContentSizeChange={(_w, h) => setContent(h)}
          scrollEventThrottle={64}
          onScroll={(e) => {
            const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent
            if (contentOffset.y + layoutMeasurement.height >= contentSize.height - END_SLACK) onReady(true)
          }}
        >
          <AppText variant="body">
            {verses.map((v) => (
              <AppText key={v.verse} variant="body">
                <AppText variant="caption" color="textSecondary">
                  {v.verse}{' '}
                </AppText>
                {v.text}{' '}
              </AppText>
            ))}
          </AppText>
        </ScrollView>
      )}
      <ChunkyButton label="Open in Bible tab" variant="secondary" onPress={openBible} />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { gap: space.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  passage: { borderWidth: 1, borderRadius: radius.lg },
  passageContent: { padding: space.lg },
})
