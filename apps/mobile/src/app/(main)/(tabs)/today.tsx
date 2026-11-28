import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCallback, useReducer, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import {
  useActivity,
  useCircle,
  useCircleStudy,
  useCompletions,
  useDayReflections,
  useEncourage,
  useMarkPrayerAnswered,
  useMembers,
  usePrayerRequests,
} from '../../../hooks/queries'
import { useAuthContext, useUserId } from '../../../hooks/use-auth-context'
import { currentDay, currentDayNumber, isDayDone } from '../../../lib/study-day'
import { GUIDED_STEPS, loadGuidedStep } from '../../../lib/guided-session'
import { currentStreak } from '../../../lib/streak'
import { slippedYesterday } from '../../../lib/missed-day'
import { firstName, longDate, timeAgo } from '../../../lib/format'
import { formatRef } from '../../../constants/books'
import ActivityRow from '../../../components/ActivityRow'
import { NudgeSheet } from '../../../components/NudgeSheet'
import { TodayTaskCard, type TodayTaskState } from '../../../components/TodayTaskCard'
import { CardSkeleton, HomeSkeleton, RowSkeleton } from '../../../components/Skeleton'
import {
  AppText,
  Avatar,
  AvatarStack,
  Button,
  Card,
  EmptyState,
  Eyebrow,
  Muted,
  Pill,
  SectionTitle,
  StreakWeek,
  type DayState,
} from '../../../components/ui'
import { colors, radii, spacing, typography } from '../../../theme/tokens'
import { useTheme } from '../../../theme'

// EmptyState falls back to a lamb when none is passed; Today shows no lamb anywhere.
const noLamb = <View />

export default function Today() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const theme = useTheme()
  const userId = useUserId()
  const { profile } = useAuthContext()
  const circle = useCircle()
  const members = useMembers(circle.id)
  const activity = useActivity(circle.id)
  const cs = useCircleStudy(circle.id)
  const completions = useCompletions(cs.data?.id)
  const prayers = usePrayerRequests(circle.id)
  const encourage = useEncourage()
  // The guided step is persisted outside React Query: re-read it whenever Today regains focus.
  const [, refreshStep] = useReducer((n: number) => n + 1, 0)
  useFocusEffect(useCallback(() => refreshStep(), []))
  const [nudged, setNudged] = useState<string | null>(null)
  const answered = useMarkPrayerAnswered(circle.id)

  const day = cs.data ? currentDay(cs.data) : undefined
  const dayNumber = cs.data ? currentDayNumber(cs.data) : undefined
  const dayReflections = useDayReflections(cs.data?.id, dayNumber)

  const memberList = members.data ?? []
  const done = completions.data ?? []
  const activeToday = memberList.filter((m) => dayNumber && isDayDone(done, m.user_id, dayNumber))
  const iAmDone = !!dayNumber && isDayDone(done, userId, dayNumber)
  const answeredCount = new Set(
    (dayReflections.data ?? []).filter((r) => r.visibility === 'circle').map((r) => r.user_id),
  ).size
  const iAnswered = (dayReflections.data ?? []).some((r) => r.user_id === userId)
  // shortcut: streak counts this study's completions only; a cross-study streak needs its own query.
  const streak = currentStreak(done.filter((c) => c.user_id === userId).map((c) => c.completed_at))
  const slipped = !!dayNumber && slippedYesterday(done, userId, dayNumber)
  const journey: DayState[] = (cs.data?.study.days ?? []).map((d) =>
    isDayDone(done, userId, d.day_number)
      ? 'done'
      : d.day_number === dayNumber
        ? 'today'
        : dayNumber && d.day_number < dayNumber
          ? 'missed'
          : 'future',
  )

  const waitingOn = memberList.find((m) => !(dayNumber && isDayDone(done, m.user_id, dayNumber)))
  const guidedStep = cs.data && day ? loadGuidedStep(cs.data.id, day.day_number) : 0
  const taskState: TodayTaskState = !iAmDone
    ? guidedStep > 0
      ? { kind: 'continue', step: guidedStep + 1, of: GUIDED_STEPS.length }
      : { kind: 'start' }
    : waitingOn
      ? { kind: 'waiting', name: firstName(waitingOn.profile?.display_name) }
      : { kind: 'allDone' }

  const refreshing = members.isRefetching || activity.isRefetching || cs.isRefetching
  const onRefresh = () => {
    members.refetch(); activity.refetch(); cs.refetch(); completions.refetch(); prayers.refetch(); dayReflections.refetch()
  }

  if (members.isPending || cs.isPending) return <HomeSkeleton />

  const openReading = () => {
    if (!day) return
    router.navigate({
      pathname: '/bible',
      params: { book: day.book_id, chapter: String(day.chapter), verse: String(day.verse_start ?? '') },
    })
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.Gold} />}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
          <Pressable hitSlop={8} onPress={() => router.push('/profile')} accessibilityLabel="Profile">
            <Avatar name={profile?.display_name} uri={profile?.avatar_url} size={40} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <AppText variant="title" accessibilityRole="header">
              Today
            </AppText>
            <AppText variant="caption" color="textSecondary">
              {longDate()}
            </AppText>
          </View>
          {streak > 0 && <Pill kind="streak" value={streak} />}
          <Pill kind="friends" value={`${activeToday.length}/${memberList.length}`} />
          <Pressable hitSlop={8} onPress={() => router.push('/chat')} accessibilityLabel="Scripture chat" style={styles.chat}>
            <Ionicons name="chatbubbles-outline" size={26} color={colors.Ink} />
          </Pressable>
        </View>

        <View style={styles.body}>
          {slipped && (
            <View testID="slipped-banner" style={[styles.banner, { backgroundColor: theme.surfaceSunken }]}>
              <View style={{ flex: 1 }}>
                <AppText variant="callout">Welcome back</AppText>
                <AppText variant="caption" color="textSecondary">
                  Life gets busy. Today is a good day to pick back up.
                </AppText>
              </View>
            </View>
          )}

          {/* Today's hero */}
          {cs.data && day ? (
            <TodayTaskCard
              title={day.title}
              passage={formatRef({ bookId: day.book_id, chapter: day.chapter, verseStart: day.verse_start, verseEnd: day.verse_end })}
              minutes={day.read_minutes}
              state={taskState}
              onStart={() => router.push('/guided')}
              onOpenBible={openReading}
            />
          ) : (
            <EmptyState
              lamb={noLamb}
              headline="No study yet"
              body="Pick a journey for your circle to read together."
              cta={{ label: 'Choose a study', onPress: () => router.navigate('/study') }}
            />
          )}

          {/* Circle */}
          <Card>
            <Eyebrow right={`${memberList.length} member${memberList.length === 1 ? '' : 's'}`}>{circle.name}</Eyebrow>
            <View style={styles.circleRow}>
              <AvatarStack
                people={memberList.map((m) => ({
                  id: m.user_id,
                  name: m.profile?.display_name,
                  uri: m.profile?.avatar_url,
                  active: activeToday.some((a) => a.user_id === m.user_id),
                }))}
              />
              <Muted>
                {activeToday.length} of {memberList.length} active today
              </Muted>
            </View>
            {journey.length > 0 && (
              <StreakWeek days={journey} labels={journey.map((_, i) => String(i + 1))} />
            )}
            {memberList.length < 2 && (
              <Muted>Invite someone with code {circle.invite_code} — tap your photo to share it.</Muted>
            )}
          </Card>

        {/* Activity */}
        <View style={{ gap: spacing.xs }}>
          <SectionTitle>Your circle today</SectionTitle>
          {activity.isPending && <RowSkeleton count={2} />}
          {(activity.data ?? []).slice(0, 6).map((a) => (
            <ActivityRow key={a.id} activity={a} members={memberList} userId={userId} />
          ))}
          {activity.isSuccess && !activity.data.length && <Muted>Nothing yet today — be the first to read.</Muted>}
        </View>

        {/* Group question */}
        {day ? (
          <Card>
            <Eyebrow>Today's group question</Eyebrow>
            <Text style={styles.question}>{day.question}</Text>
            <Muted>
              {answeredCount === 0
                ? 'No one has answered yet'
                : `${answeredCount} ${answeredCount === 1 ? 'friend has' : 'friends have'} answered`}
            </Muted>
            <Button
              label={iAnswered ? 'See responses' : 'Share your answer'}
              variant={iAnswered ? 'outline' : 'solid'}
              onPress={() => (iAnswered ? router.navigate('/study') : router.push({ pathname: '/reflect', params: { mode: 'day' } }))}
            />
          </Card>
        ) : null}

        {/* Encourage */}
        {memberList.length > 1 && (
          <View style={{ gap: spacing.xs }}>
            <SectionTitle>Encourage someone</SectionTitle>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {memberList
                .filter((m) => m.user_id !== userId)
                .map((m) => (
                  <Pressable
                    key={m.user_id}
                    style={styles.encourageChip}
                    onPress={() =>
                      encourage.mutate(
                        { circleId: circle.id, toUser: m.user_id, kind: 'praying' },
                        { onSuccess: () => setNudged(firstName(m.profile?.display_name)) },
                      )
                    }
                  >
                    <Avatar name={m.profile?.display_name} uri={m.profile?.avatar_url} size={28} />
                    <Text style={styles.chipText}>🙏 Pray for {firstName(m.profile?.display_name)}</Text>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Prayer requests */}
        <View style={{ gap: spacing.sm }}>
          <View style={styles.headerRow}>
            <SectionTitle>Prayer requests</SectionTitle>
            <Pressable hitSlop={12} onPress={() => router.push('/prayer')}>
              <Ionicons name="add-circle-outline" size={24} color={colors.Gold} />
            </Pressable>
          </View>
          {prayers.isPending && <CardSkeleton lines={2} button={false} />}
          {(prayers.data ?? []).map((p) => {
            const author = memberList.find((m) => m.user_id === p.user_id)?.profile?.display_name
            const mine = p.user_id === userId
            const prayed = p.encouragements ?? []
            const iPrayed = prayed.some((e) => e.from_user === userId)
            return (
              <Card key={p.id} style={{ gap: spacing.xs }}>
                <Text style={styles.prayerMeta}>
                  {mine ? 'You' : firstName(author)} · {timeAgo(p.created_at)}
                </Text>
                <Text style={styles.prayerBody}>{p.body}</Text>
                <View style={styles.headerRow}>
                  <Muted>{prayed.length ? `🙏 ${prayed.length} prayed` : ' '}</Muted>
                  {mine ? (
                    <Pressable onPress={() => answered.mutate(p.id)}>
                      <Text style={styles.link}>Mark answered</Text>
                    </Pressable>
                  ) : (
                    <Pressable
                      disabled={iPrayed}
                      onPress={() =>
                        encourage.mutate(
                          { circleId: circle.id, toUser: p.user_id, kind: 'praying', prayerRequestId: p.id },
                          { onSuccess: () => setNudged(firstName(author)) },
                        )
                      }
                    >
                      <Text style={styles.link}>{iPrayed ? 'You prayed ✓' : 'I prayed for you'}</Text>
                    </Pressable>
                  )}
                </View>
              </Card>
            )
          })}
          {prayers.isSuccess && !prayers.data.length && (
            <View testID="prayer-empty">
              <EmptyState
                lamb={noLamb}
                headline="No open requests"
                body="Share what's on your heart."
              />
            </View>
          )}
        </View>
        </View>
      </ScrollView>
      <NudgeSheet name={nudged} onClose={() => setNudged(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: spacing.xxl },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.lg },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  chat: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  circleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  question: { fontFamily: typography.fontFamily.display, fontSize: 22, lineHeight: 28, color: colors.Ink },
  encourageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipText: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.Ink },
  prayerMeta: { fontFamily: typography.fontFamily.body, fontSize: typography.fontSize.caption, color: colors.muted },
  prayerBody: { fontFamily: typography.fontFamily.body, fontSize: 15, lineHeight: 22, color: colors.Ink },
  link: { fontFamily: typography.fontFamily.body, fontSize: 14, color: colors.Gold },
})
