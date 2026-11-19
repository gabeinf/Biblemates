import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { setTabBarHidden } from '../../../lib/tab-bar'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  useBookmarks,
  useChapter,
  useChapterReflections,
  useCircle,
  useCircleStudy,
  useCompletions,
  useHighlights,
  useMarkDayComplete,
  useReadingPosition,
  useSetHighlight,
  useToggleBookmark,
} from '../../../hooks/queries'
import { useUserId } from '../../../hooks/use-auth-context'
import { getBook, nextChapter, prevChapter } from '../../../constants/books'
import { saveReadingPosition } from '../../../services/annotations'
import { currentDay, isDayDone } from '../../../lib/study-day'
import BookPicker from '../../../components/bible/BookPicker'
import VerseActionSheet from '../../../components/bible/VerseActionSheet'
import { ErrorState } from '../../../components/ui'
import { BibleSkeleton, VersesSkeleton } from '../../../components/Skeleton'
import { getLastPosition, getLastTranslation, setLastTranslation } from '../../../lib/reader-prefs'
import type { BibleVerse, PassageRef, TranslationId } from '../../../types/bible'
import { colors, highlightColors, radii, spacing, typography, type HighlightColor } from '../../../theme/tokens'

export default function Bible() {
  const router = useRouter()
  const userId = useUserId()
  const circle = useCircle()
  const params = useLocalSearchParams<{ book?: string; chapter?: string; verse?: string }>()
  const savedPosition = useReadingPosition()

  const [translation, setTranslation] = useState<TranslationId>(getLastTranslation)
  // Open instantly on the on-device last position (its chapter was prefetched
  // during the splash); fall back to the server copy on a new device.
  const [pos, setPos] = useState<PassageRef | null>(getLastPosition)
  const [selected, setSelected] = useState<BibleVerse | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const listRef = useRef<FlatList<BibleVerse>>(null)

  // Deep-link from Home/Study wins; otherwise resume where the user left off.
  useEffect(() => {
    if (params.book && params.chapter) {
      setPos({ bookId: params.book, chapter: Number(params.chapter), verseStart: params.verse ? Number(params.verse) : null })
    }
  }, [params.book, params.chapter, params.verse])

  useEffect(() => {
    if (pos || savedPosition.isPending) return
    const p = savedPosition.data
    setPos(p ? { bookId: p.book_id, chapter: p.chapter } : { bookId: 'JHN', chapter: 1 })
  }, [savedPosition.isPending, savedPosition.data, pos])

  const bookId = pos?.bookId ?? 'JHN'
  const chapterNum = pos?.chapter ?? 1

  const chapter = useChapter(translation, bookId, chapterNum)
  const highlights = useHighlights(bookId, chapterNum)
  const reflections = useChapterReflections(circle.id, bookId, chapterNum)
  const bookmarks = useBookmarks()
  const setHighlight = useSetHighlight(bookId, chapterNum)
  const toggleBookmark = useToggleBookmark()

  // Is this chapter today's shared reading?
  const cs = useCircleStudy(circle.id)
  const completions = useCompletions(cs.data?.id)
  const markDone = useMarkDayComplete(cs.data?.id ?? '')
  const today = cs.data ? currentDay(cs.data) : undefined
  const isTodaysReading = !!today && today.book_id === bookId && today.chapter === chapterNum
  const doneToday = !!today && isDayDone(completions.data ?? [], userId, today.day_number)

  useEffect(() => {
    if (!pos) return
    saveReadingPosition({ book_id: bookId, chapter: chapterNum, translation })
  }, [bookId, chapterNum, translation, pos])

  // Scroll to a requested verse once the chapter is loaded.
  useEffect(() => {
    const v = pos?.verseStart
    if (!v || !chapter.data) return
    const idx = chapter.data.verses.findIndex((x) => x.verse === v)
    if (idx > 0) setTimeout(() => listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.2 }), 250)
  }, [chapter.data, pos?.verseStart])

  const highlightByVerse = useMemo(() => new Map((highlights.data ?? []).map((h) => [h.verse, h.color])), [highlights.data])
  const circleCountByVerse = useMemo(() => {
    const m = new Map<number, number>()
    for (const r of reflections.data ?? []) {
      if (r.verse && r.visibility === 'circle' && r.user_id !== userId) m.set(r.verse, (m.get(r.verse) ?? 0) + 1)
    }
    return m
  }, [reflections.data, userId])
  const myNoteVerses = useMemo(
    () => new Set((reflections.data ?? []).filter((r) => r.user_id === userId && r.verse).map((r) => r.verse!)),
    [reflections.data, userId],
  )
  const isBookmarked = (v: number) => (bookmarks.data ?? []).some((b) => b.book_id === bookId && b.chapter === chapterNum && b.verse === v)

  // Tab bar: tuck it away while reading forward; only a deliberate, quick swipe
  // back (not slow re-reading) brings it back. Always shown near the top/end.
  const lastScroll = useRef({ y: 0, t: 0 })
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    const y = contentOffset.y
    const t = e.timeStamp || Date.now()
    const dy = y - lastScroll.current.y
    const dt = Math.max(t - lastScroll.current.t, 1)
    lastScroll.current = { y, t }
    if (selected) return

    const nearTop = y < 80
    const nearEnd = y + layoutMeasurement.height >= contentSize.height - 40
    if (nearTop || nearEnd) setTabBarHidden(false)
    else if (dy > 4) setTabBarHidden(true)
    else if (dy < 0 && -dy / dt > SHOW_TAB_BAR_VELOCITY) setTabBarHidden(false)
  }

  // Keep the bar out of the way of the verse footer.
  useEffect(() => {
    if (selected) setTabBarHidden(true)
  }, [selected])

  // Never leave the bar hidden for other tabs.
  useFocusEffect(useCallback(() => () => setTabBarHidden(false), []))

  const go = (ref: PassageRef | null) => {
    if (!ref) return
    setTabBarHidden(false)
    setPos(ref)
    listRef.current?.scrollToOffset({ offset: 0, animated: false })
  }

  const changeTranslation = (t: TranslationId) => {
    setTranslation(t)
    setLastTranslation(t)
  }

  const openReflect = (visibility: 'private' | 'circle') => {
    if (!selected) return
    const v = selected
    setSelected(null)
    router.push({
      pathname: '/reflect',
      params: { mode: 'verse', visibility, book: v.bookId, chapter: String(v.chapter), verse: String(v.verse) },
    })
  }

  if (!pos) return <BibleSkeleton />

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.toolbar}>
        <Pressable onPress={() => setPickerOpen(true)} style={styles.refButton}>
          <Text style={styles.refText}>
            {getBook(bookId).name} {chapterNum}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.Ink} />
        </Pressable>
        <Pressable onPress={() => setPickerOpen(true)} style={styles.translationPill}>
          <Text style={styles.translationText}>{translation.toUpperCase()}</Text>
        </Pressable>
      </View>

      {chapter.isPending ? (
        <VersesSkeleton />
      ) : chapter.isError ? (
        <ErrorState message={chapter.error.message} onRetry={() => chapter.refetch()} />
      ) : (
        <FlatList
          ref={listRef}
          data={chapter.data.verses}
          keyExtractor={(v) => String(v.verse)}
          contentContainerStyle={[styles.content, selected && { paddingBottom: 200 }]}
          extraData={selected}
          contentInsetAdjustmentBehavior="automatic"
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={() => {}}
          ListHeaderComponent={<Text style={styles.chapterTitle}>{`${getBook(bookId).name} ${chapterNum}`}</Text>}
          renderItem={({ item }) => {
            const hl = highlightByVerse.get(item.verse) as HighlightColor | undefined
            const count = circleCountByVerse.get(item.verse)
            const isSelected = selected?.verse === item.verse
            return (
              <View>
                <Pressable
                  onPress={() => setSelected(isSelected ? null : item)}
                  style={[styles.verse, hl && { backgroundColor: highlightColors[hl] ?? highlightColors.gold }]}
                >
                  <Text style={styles.verseText}>
                    <Text style={styles.verseNum}>{item.verse} </Text>
                    <Text style={isSelected && styles.verseSelected}>{item.text}</Text>
                    {myNoteVerses.has(item.verse) ? <Text style={styles.noteMark}>  ✎</Text> : null}
                  </Text>
                </Pressable>
                {count ? (
                  <Pressable
                    style={styles.indicator}
                    onPress={() =>
                      router.push({
                        pathname: '/verse-reflections',
                        params: { book: bookId, chapter: String(chapterNum), verse: String(item.verse) },
                      })
                    }
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.Gold} />
                    <Text style={styles.indicatorText}>
                      {count} circle reflection{count === 1 ? '' : 's'} on this verse
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )
          }}
          ListFooterComponent={
            <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
              {isTodaysReading && !doneToday && (
                <Pressable style={styles.doneBanner} onPress={() => markDone.mutate(today!.day_number)}>
                  <Ionicons name="checkmark-circle-outline" size={20} color={colors.surface} />
                  <Text style={styles.doneBannerText}>Mark Day {today!.day_number} as read</Text>
                </Pressable>
              )}
              {isTodaysReading && doneToday && (
                <Pressable style={styles.nextStep} onPress={() => router.navigate('/study')}>
                  <Text style={styles.nextStepText}>Read · Reflect · Share → Continue in Study</Text>
                </Pressable>
              )}
              <View style={styles.navRow}>
                <Pressable onPress={() => go(prevChapter(bookId, chapterNum))} hitSlop={12} style={styles.navButton}>
                  <Ionicons name="chevron-back" size={18} color={colors.Gold} />
                  <Text style={styles.navText}>Previous</Text>
                </Pressable>
                <Pressable onPress={() => go(nextChapter(bookId, chapterNum))} hitSlop={12} style={styles.navButton}>
                  <Text style={styles.navText}>Next</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.Gold} />
                </Pressable>
              </View>
              <Text style={styles.copyright}>{chapter.data.translation.toUpperCase()} · Public domain</Text>
            </View>
          }
        />
      )}

      <BookPicker
        visible={pickerOpen}
        translation={translation}
        onClose={() => setPickerOpen(false)}
        onSelect={go}
        onTranslation={changeTranslation}
      />

      <VerseActionSheet
        verse={selected}
        highlight={selected ? highlightByVerse.get(selected.verse) : undefined}
        bookmarked={selected ? isBookmarked(selected.verse) : false}
        circleReflectionCount={selected ? circleCountByVerse.get(selected.verse) ?? 0 : 0}
        onClose={() => setSelected(null)}
        onHighlight={(color) => {
          if (selected) setHighlight.mutate({ verse: selected.verse, color })
          setSelected(null)
        }}
        onBookmark={() => {
          if (selected)
            toggleBookmark.mutate({ bookId, chapter: chapterNum, verse: selected.verse, on: !isBookmarked(selected.verse) })
          setSelected(null)
        }}
        onPrivateNote={() => openReflect('private')}
        onShare={() => openReflect('circle')}
        onViewReflections={() => {
          const v = selected
          setSelected(null)
          if (v)
            router.push({
              pathname: '/verse-reflections',
              params: { book: bookId, chapter: String(chapterNum), verse: String(v.verse) },
            })
        }}
      />
    </SafeAreaView>
  )
}

/** px/ms of upward scroll needed to reveal the tab bar — slow re-reading stays below this. */
const SHOW_TAB_BAR_VELOCITY = 1.2

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  refButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  refText: { fontFamily: typography.fontFamily.body, fontSize: 17, color: colors.Ink },
  translationPill: { borderWidth: 1, borderColor: colors.Gold, borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  translationText: { fontFamily: typography.fontFamily.body, fontSize: 12, color: colors.Gold },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  chapterTitle: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.title, color: colors.Ink, marginBottom: spacing.md },
  verse: { borderRadius: radii.xs, paddingHorizontal: spacing.xxs, paddingVertical: 2, marginHorizontal: -spacing.xxs },
  verseSelected: { textDecorationLine: 'underline', textDecorationColor: colors.Gold, textDecorationStyle: 'solid' },
  verseText: { fontFamily: typography.fontFamily.body, fontSize: 18, lineHeight: 30, color: colors.Ink },
  verseNum: { fontSize: 11, color: colors.Gold },
  noteMark: { fontSize: 13, color: colors.Gold },
  indicator: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, paddingVertical: spacing.xxs, paddingLeft: spacing.md },
  indicatorText: { fontFamily: typography.fontFamily.bodyItalic, fontSize: 13, color: colors.Gold },
  doneBanner: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.Gold,
    borderRadius: radii.sm,
    padding: spacing.md,
  },
  doneBannerText: { fontFamily: typography.fontFamily.body, color: colors.surface, fontSize: 16 },
  nextStep: { alignItems: 'center', padding: spacing.md, borderRadius: radii.sm, backgroundColor: colors.goldSoft },
  nextStepText: { fontFamily: typography.fontFamily.body, color: colors.Gold },
  navRow: { flexDirection: 'row', justifyContent: 'space-between' },
  navButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  navText: { fontFamily: typography.fontFamily.body, color: colors.Gold, fontSize: 15 },
  copyright: { textAlign: 'center', fontFamily: typography.fontFamily.body, fontSize: 11, color: colors.muted },
})
