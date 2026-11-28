import { useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  useCircle,
  useCircleStudy,
  useCompletions,
  useDayReflections,
  useMembers,
  useReadingPosition,
  useStartStudy,
  useStudies,
} from '../../../hooks/queries'
import { useUserId } from '../../../hooks/use-auth-context'
import { currentDayNumber, isDayDone, percentComplete } from '../../../lib/study-day'
import { formatRef, getBook, TRANSLATIONS } from '../../../constants/books'
import { getLastTranslation } from '../../../lib/reader-prefs'
import ReflectionCard from '../../../components/ReflectionCard'
import { Button, Card, ErrorState, Eyebrow, LambView, Muted, ProgressTrack, SectionTitle } from '../../../components/ui'
import { RowSkeleton, StudySkeleton } from '../../../components/Skeleton'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

function Step({ done, title, sub, onPress }: { done: boolean; title: string; sub?: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.step} onPress={onPress} disabled={!onPress}>
      <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={done ? colors.success : colors.inactive} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.stepTitle}>{title}</Text>
        {sub ? <Muted>{sub}</Muted> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.inactive} /> : null}
    </Pressable>
  )
}

function Plans() {
  const router = useRouter()
  const userId = useUserId()
  const circle = useCircle()
  const members = useMembers(circle.id)
  const cs = useCircleStudy(circle.id)
  const completions = useCompletions(cs.data?.id)
  const studies = useStudies()
  const startStudy = useStartStudy(circle.id)

  const today = cs.data ? currentDayNumber(cs.data) : 1
  const [viewDay, setViewDay] = useState(today)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => setViewDay(today), [today])
  useEffect(() => setRevealed(false), [viewDay])

  const reflections = useDayReflections(cs.data?.id, viewDay)

  if (cs.isPending) return <StudySkeleton />
  if (cs.isError) return <ErrorState message={cs.error.message} onRetry={() => cs.refetch()} />

  const isOwner = members.data?.some((m) => m.user_id === userId && m.role === 'owner')

  if (!cs.data || cs.data.status === 'completed') {
    return (
      <SafeAreaView style={styles.screen} edges={[]}>
        <ScrollView contentContainerStyle={styles.content}>
          <LambView view="front" size={120} style={{ alignSelf: 'center' }} />
          <Eyebrow>Your study</Eyebrow>
          <Text style={styles.hero}>{cs.data ? `You finished ${cs.data.study.title}!` : 'Choose a journey'}</Text>
          <Muted>{isOwner ? 'Pick the next 7-day journey for your circle.' : 'Your circle owner will pick the next journey.'}</Muted>
          {isOwner &&
            studies.data?.map((s) => (
              <Card key={s.id}>
                <SectionTitle>{s.title}</SectionTitle>
                <Muted>{s.description}</Muted>
                <Button label="Start this study" loading={startStudy.isPending} onPress={() => startStudy.mutate(s.id)} />
              </Card>
            ))}
        </ScrollView>
      </SafeAreaView>
    )
  }

  const study = cs.data.study
  const day = study.days.find((d) => d.day_number === viewDay)
  const done = completions.data ?? []
  const read = isDayDone(done, userId, viewDay)
  const mine = (reflections.data ?? []).filter((r) => r.user_id === userId)
  const others = (reflections.data ?? []).filter((r) => r.user_id !== userId && r.visibility === 'circle')
  const reflected = mine.length > 0
  const shared = mine.some((r) => r.visibility === 'circle')
  const encouragedSomeone = others.some((r) => r.encouragements?.some((e) => e.from_user === userId))
  const showResponses = reflected || revealed

  const openReading = () =>
    day &&
    router.navigate({
      pathname: '/bible',
      params: { book: day.book_id, chapter: String(day.chapter), verse: String(day.verse_start ?? '') },
    })
  const openReflect = () => router.push({ pathname: '/reflect', params: { mode: 'day', day: String(viewDay) } })

  return (
    <SafeAreaView style={styles.screen} edges={[]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={cs.isRefetching}
            onRefresh={() => {
              cs.refetch(); completions.refetch(); reflections.refetch()
            }}
            tintColor={colors.Gold}
          />
        }
      >
        <Eyebrow>Your study</Eyebrow>

        <Card>
          <Eyebrow>Your group's current study</Eyebrow>
          <Text style={styles.hero}>{study.title}</Text>
          <Muted>{study.description}</Muted>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              Day {today} of {study.total_days}
            </Text>
            <Text style={styles.progressLabel}>{percentComplete(cs.data, done, userId)}% complete</Text>
          </View>
          <ProgressTrack value={percentComplete(cs.data, done, userId)} />
          <Button label={read ? 'Read again' : 'Continue study'} variant={read ? 'outline' : 'solid'} onPress={openReading} />
        </Card>

        {/* Day selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {study.days.map((d) => {
            const locked = d.day_number > today
            const isDone = isDayDone(done, userId, d.day_number)
            return (
              <Pressable
                key={d.day_number}
                disabled={locked}
                onPress={() => setViewDay(d.day_number)}
                style={[styles.dayChip, d.day_number === viewDay && styles.dayChipActive, locked && { opacity: 0.4 }]}
              >
                <Text style={[styles.dayChipText, d.day_number === viewDay && { color: colors.surface }]}>
                  {isDone ? '✓ ' : ''}Day {d.day_number}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {day && (
          <View style={{ gap: spacing.xs }}>
            <SectionTitle>{viewDay === today ? "Today's journey" : `Day ${viewDay}: ${day.title}`}</SectionTitle>
            <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
              <Step
                done={read}
                title={`Read ${formatRef({ bookId: day.book_id, chapter: day.chapter, verseStart: day.verse_start, verseEnd: day.verse_end })}`}
                sub={read ? 'Completed' : `${day.read_minutes} minutes of Scripture`}
                onPress={openReading}
              />
              <View style={styles.divider} />
              <Step done={reflected} title="Reflect on the passage" sub={day.question} onPress={reflected ? undefined : openReflect} />
              <View style={styles.divider} />
              <Step done={shared || encouragedSomeone} title="Share with your circle" sub="Encourage one another" />
            </Card>
          </View>
        )}

        {/* Group reflections */}
        <View style={{ gap: spacing.xs }}>
          <View style={styles.rowBetween}>
            <SectionTitle>Group reflections</SectionTitle>
            <Muted>
              {others.length} response{others.length === 1 ? '' : 's'}
            </Muted>
          </View>

          {reflections.isPending ? (
            <Card>
              <RowSkeleton count={2} avatar={36} />
            </Card>
          ) : !showResponses ? (
            <Card style={{ alignItems: 'center', gap: spacing.md }}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.Gold} />
              <Muted style={{ textAlign: 'center' }}>
                Share your answer to see what your circle wrote — or read along without posting.
              </Muted>
              <Button label="Share your answer" onPress={openReflect} style={{ alignSelf: 'stretch' }} />
              <Button label="Read without posting" variant="ghost" onPress={() => setRevealed(true)} />
            </Card>
          ) : (
            <Card style={{ gap: 0 }}>
              {mine.map((r) => (
                <ReflectionCard key={r.id} reflection={r} members={members.data ?? []} />
              ))}
              {others.map((r) => (
                <ReflectionCard key={r.id} reflection={r} members={members.data ?? []} />
              ))}
              {!mine.length && !others.length && <Muted>No reflections yet for this day.</Muted>}
              {!reflected && <Button label="Add your reflection" variant="outline" onPress={openReflect} style={{ marginTop: spacing.sm }} />}
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function BibleRow({ icon, label, value, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress: () => void }) {
  return (
    <Pressable style={styles.step} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={22} color={colors.Gold} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.stepTitle}>{label}</Text>
        <Muted>{value}</Muted>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.inactive} />
    </Pressable>
  )
}

function BiblePanel() {
  const router = useRouter()
  const position = useReadingPosition().data
  const open = (params?: { book: string; chapter: string }) => router.push({ pathname: '/bible', params })
  const translation = TRANSLATIONS.find((t) => t.id === getLastTranslation())?.name ?? 'World English Bible'
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
        <BibleRow
          icon="book-outline"
          label="Continue where you left off"
          value={position ? `${getBook(position.book_id).name} ${position.chapter}` : 'John 1'}
          onPress={() => open(position ? { book: position.book_id, chapter: String(position.chapter) } : undefined)}
        />
        <View style={styles.divider} />
        <BibleRow icon="list-outline" label="Choose a book" value="Browse all 66 books" onPress={() => open()} />
        <View style={styles.divider} />
        <BibleRow icon="language-outline" label="Translation" value={translation} onPress={() => open()} />
      </Card>
    </ScrollView>
  )
}

export default function Study() {
  const [tab, setTab] = useState<'plans' | 'bible'>('plans')
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.segments}>
        {(['plans', 'bible'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            style={[styles.segment, tab === t && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, tab === t && { color: colors.surface }]}>{t === 'plans' ? 'Plans' : 'Bible'}</Text>
          </Pressable>
        ))}
      </View>
      {tab === 'plans' ? <Plans /> : <BiblePanel />}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  segments: { flexDirection: 'row', margin: spacing.lg, marginBottom: 0, borderRadius: radii.full, borderWidth: 1, borderColor: colors.Gold, overflow: 'hidden' },
  segment: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs },
  segmentActive: { backgroundColor: colors.Gold },
  segmentText: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.Gold },
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  hero: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.title, color: colors.Ink },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  progressLabel: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.muted },
  dayChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.Gold,
  },
  dayChipActive: { backgroundColor: colors.Gold },
  dayChipText: { fontFamily: typography.fontFamily.body, fontSize: 13, color: colors.Gold },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  stepTitle: { fontFamily: typography.fontFamily.body, fontSize: 16, color: colors.Ink },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
})
