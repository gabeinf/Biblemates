import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
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
import { currentDay, currentDayNumber, isDayDone, progressByDay } from '../../../lib/study-day'
import { firstName, longDate, timeAgo } from '../../../lib/format'
import { formatRef } from '../../../constants/books'
import ActivityRow from '../../../components/ActivityRow'
import { CardSkeleton, HomeSkeleton, RowSkeleton } from '../../../components/Skeleton'
import { Avatar, AvatarStack, Button, Card, Eyebrow, Muted, SectionTitle } from '../../../components/ui'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

export default function Home() {
  const router = useRouter()
  const userId = useUserId()
  const { profile } = useAuthContext()
  const circle = useCircle()
  const members = useMembers(circle.id)
  const activity = useActivity(circle.id)
  const cs = useCircleStudy(circle.id)
  const completions = useCompletions(cs.data?.id)
  const prayers = usePrayerRequests(circle.id)
  const encourage = useEncourage()
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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.Gold} />}
      >
        {/* Header */}
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={() => router.push('/profile')} accessibilityLabel="Profile">
            <Avatar name={profile?.display_name} uri={profile?.avatar_url} size={40} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Eyebrow>{longDate()}</Eyebrow>
          </View>
          <Pressable hitSlop={8} onPress={() => router.push('/chat')} accessibilityLabel="Scripture chat">
            <Ionicons name="chatbubbles-outline" size={26} color={colors.Ink} />
          </Pressable>
        </View>
        <Text style={styles.hero}>Grow together, every day.</Text>

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
          {cs.data && (
            <View style={styles.dots}>
              {progressByDay(cs.data, done).map((p) => (
                <View key={p.day} style={{ alignItems: 'center', gap: 4, flex: 1 }}>
                  <View
                    style={[
                      styles.dot,
                      { opacity: memberList.length ? 0.25 + 0.75 * (p.count / memberList.length) : 0.25 },
                      p.day === dayNumber && styles.dotToday,
                    ]}
                  />
                  <Text style={styles.dotLabel}>{p.day}</Text>
                </View>
              ))}
            </View>
          )}
          {memberList.length < 2 && (
            <Muted>Invite someone with code {circle.invite_code} — tap your photo to share it.</Muted>
          )}
        </Card>

        {/* Today's shared reading */}
        {cs.data && day ? (
          <Card>
            <Eyebrow right={`Day ${day.day_number} of ${cs.data.study.total_days}`}>Today's shared reading</Eyebrow>
            <SectionTitle>{day.title}</SectionTitle>
            <Muted>
              {formatRef({ bookId: day.book_id, chapter: day.chapter, verseStart: day.verse_start, verseEnd: day.verse_end })} ·{' '}
              {day.read_minutes} min read
            </Muted>
            {iAmDone ? (
              <View style={styles.doneRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text style={styles.doneText}>You've read today</Text>
              </View>
            ) : (
              <Button label="Continue reading" onPress={openReading} />
            )}
          </Card>
        ) : null}

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
                    onPress={() => encourage.mutate({ circleId: circle.id, toUser: m.user_id, kind: 'praying' })}
                  >
                    <Avatar name={m.profile?.display_name} uri={m.profile?.avatar_url} size={28} />
                    <Text style={styles.chipText}>🙏 Pray for {firstName(m.profile?.display_name)}</Text>
                  </Pressable>
                ))}
            </ScrollView>
            {encourage.isSuccess && <Muted>Sent — they'll know you're praying for them.</Muted>}
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
                        encourage.mutate({ circleId: circle.id, toUser: p.user_id, kind: 'praying', prayerRequestId: p.id })
                      }
                    >
                      <Text style={styles.link}>{iPrayed ? 'You prayed ✓' : 'I prayed for you'}</Text>
                    </Pressable>
                  )}
                </View>
              </Card>
            )
          })}
          {prayers.isSuccess && !prayers.data.length && <Muted>No open requests. Share what's on your heart.</Muted>}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { fontFamily: typography.fontFamily.display, fontSize: typography.fontSize.title, color: colors.Ink, marginTop: -spacing.sm },
  circleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', marginTop: spacing.xs },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.Gold },
  dotToday: { borderWidth: 2, borderColor: colors.Ink },
  dotLabel: { fontSize: 10, color: colors.muted, fontFamily: typography.fontFamily.body },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  doneText: { fontFamily: typography.fontFamily.body, color: colors.success },
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
