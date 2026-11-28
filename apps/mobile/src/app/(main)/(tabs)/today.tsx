import { Pressable, RefreshControl, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useCircle, useCircleStudy, useCompletions, useMembers, useSeedBalance } from '../../../hooks/queries'
import { useAuthContext, useUserId } from '../../../hooks/use-auth-context'
import { currentDay, currentDayNumber, isDayDone } from '../../../lib/study-day'
import { GUIDED_STEPS, loadGuidedStep } from '../../../lib/guided-session'
import { currentStreak } from '../../../lib/streak'
import { weekGoal } from '../../../lib/week-goal'
import { firstName } from '../../../lib/format'
import { LearningPath } from '../../../components/LearningPath'
import { HomeSkeleton } from '../../../components/Skeleton'
import { AppText, Avatar, EmptyState, Pill, type DayState } from '../../../components/ui'
import { colors, spacing } from '../../../theme/tokens'
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
  const cs = useCircleStudy(circle.id)
  const completions = useCompletions(cs.data?.id)
  const seeds = useSeedBalance()
  // The guided step is persisted outside React Query: re-read it whenever Today regains focus.
  const [, refreshStep] = useReducer((n: number) => n + 1, 0)
  useFocusEffect(useCallback(() => refreshStep(), []))

  const scroll = useRef<ScrollViewInstance>(null)
  const [viewport, setViewport] = useState(0)
  const [pathY, setPathY] = useState<number>()
  const [todayY, setTodayY] = useState<number>()
  // Centre today's node once, when its position and the viewport are both known.
  const centred = useRef(false)
  useEffect(() => {
    if (centred.current || !viewport || pathY === undefined || todayY === undefined) return
    centred.current = true
    scroll.current?.scrollTo({ y: Math.max(0, pathY + todayY - viewport / 2), animated: false })
  }, [viewport, pathY, todayY])

  const day = cs.data ? currentDay(cs.data) : undefined
  const dayNumber = cs.data ? currentDayNumber(cs.data) : undefined

  const memberList = members.data ?? []
  const done = completions.data ?? []
  const iAmDone = !!dayNumber && isDayDone(done, userId, dayNumber)
  // shortcut: streak and week goal count this study's completions only; a cross-study count needs its own query.
  const myCompletions = done.filter((c) => c.user_id === userId).map((c) => c.completed_at)
  const streak = currentStreak(myCompletions)
  // Not before completions load: an empty list would read as a missed week.
  const goal = circle.goal_days_per_week && completions.data ? weekGoal(myCompletions, circle.goal_days_per_week) : null
  const days: DayState[] = (cs.data?.study.days ?? []).map((d) =>
    d.day_number === dayNumber && !iAmDone
      ? 'today'
      : isDayDone(done, userId, d.day_number)
        ? 'done'
        : dayNumber && d.day_number < dayNumber
          ? 'missed'
          : 'future',
  )
  const partnersDone = memberList.filter((m) => m.user_id !== userId && dayNumber && isDayDone(done, m.user_id, dayNumber))
  const waitingOn = memberList.find((m) => !(dayNumber && isDayDone(done, m.user_id, dayNumber)))
  const guidedStep = cs.data && day ? loadGuidedStep(cs.data.id, day.day_number) : 0
  const bubble = guidedStep > 0 ? `Continue, step ${guidedStep + 1} of ${GUIDED_STEPS.length}` : 'Start'
  const caption = !iAmDone ? undefined : waitingOn ? `Done, waiting on ${firstName(waitingOn.profile?.display_name)}` : 'Whole flock read today'

  const refreshing = members.isRefetching || cs.isRefetching
  const onRefresh = () => {
    members.refetch(); cs.refetch(); completions.refetch()
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
        ref={scroll}
        testID="today-scroll"
        onLayout={(e) => setViewport(e.nativeEvent.layout.height)}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.Gold} />}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + spacing.xs }]}>
          <Pressable hitSlop={8} onPress={() => router.push('/profile')} accessibilityLabel="Profile">
            <Avatar name={profile?.display_name} uri={profile?.avatar_url} size={40} />
          </Pressable>
          <View style={{ flex: 1 }} />
          {seeds.data !== undefined && <Pill kind="seed" value={seeds.data} />}
          {streak > 0 && <Pill kind="streak" value={streak} />}
          <Pressable hitSlop={8} onPress={() => router.push('/chat')} accessibilityLabel="Scripture chat" style={styles.chat}>
            <Ionicons name="chatbubbles-outline" size={26} color={colors.Ink} />
          </Pressable>
        </View>

        {cs.data && day && dayNumber ? (
          <>
            <View style={styles.heading}>
              <AppText variant="headline" accessibilityRole="header" style={styles.center}>
                {cs.data.study.title}, Day {dayNumber} of {cs.data.study.total_days}
              </AppText>
              {goal?.behind && circle.stakes_label ? (
                <AppText testID="week-goal" variant="caption" color="textSecondary" style={styles.center}>
                  Miss your goal and you owe: {circle.stakes_label}
                </AppText>
              ) : null}
            </View>
            <View onLayout={(e) => setPathY(e.nativeEvent.layout.y)}>
              <LearningPath
                days={days}
                todayNumber={dayNumber}
                bubble={bubble}
                caption={caption}
                partners={partnersDone.map((m) => ({ id: m.user_id, name: m.profile?.display_name, uri: m.profile?.avatar_url }))}
                onStartToday={() => router.push('/guided')}
                onTodayLayout={setTodayY}
              />
            </View>
            <Pressable hitSlop={8} onPress={openReading} accessibilityRole="link" accessibilityLabel="Open in Bible" style={styles.link}>
              <AppText variant="callout" color="textSecondary">
                Open in Bible
              </AppText>
            </Pressable>
          </>
        ) : (
          <View style={styles.empty}>
            <EmptyState
              lamb={noLamb}
              headline="No study yet"
              body="Pick a journey for your circle to read together."
              cta={{ label: 'Choose a study', onPress: () => router.navigate('/study') }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { paddingBottom: spacing.xxl },
  chat: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md },
  heading: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.xs },
  center: { textAlign: 'center' },
  link: { alignSelf: 'center', paddingVertical: spacing.sm },
  empty: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
})
