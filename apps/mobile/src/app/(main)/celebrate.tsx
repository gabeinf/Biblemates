import { useLocalSearchParams, useRouter } from 'expo-router'
import { CelebrationScaffold, LambView, type Tile } from '../../components/ui'
import { useCircle, useCircleStudy, useCompletions, useMembers } from '../../hooks/queries'
import { useUserId } from '../../hooks/use-auth-context'
import { formatRef } from '../../constants/books'
import { currentDay, currentDayNumber, isDayDone } from '../../lib/study-day'
import { currentStreak } from '../../lib/streak'

/**
 * Full-screen success moment. `kind=checkin`: I just marked today's reading read (after
 * `useMarkDayComplete`). `kind=study`: the whole circle finished the study (activity `milestone`).
 */
export default function Celebrate() {
  const router = useRouter()
  const { kind } = useLocalSearchParams<{ kind?: string }>()
  const userId = useUserId()
  const circle = useCircle()
  const members = useMembers(circle.id)
  const cs = useCircleStudy(circle.id)
  const completions = useCompletions(cs.data?.id)

  const memberList = members.data ?? []
  const done = completions.data ?? []
  const day = cs.data ? currentDay(cs.data) : undefined
  const dayNumber = cs.data ? currentDayNumber(cs.data) : undefined
  const readToday = memberList.filter((m) => !!dayNumber && isDayDone(done, m.user_id, dayNumber)).length
  const streak = currentStreak(done.filter((c) => c.user_id === userId).map((c) => c.completed_at))
  const onContinue = () => router.dismissTo('/home')

  const tiles: Tile[] = []
  if (kind !== 'study' && streak > 0) tiles.push({ kind: 'streak', label: 'Streak', value: streak })
  if (memberList.length > 0) {
    const value = kind === 'study' ? String(memberList.length) : `${readToday}/${memberList.length}`
    tiles.push({ kind: 'friends', label: kind === 'study' ? 'Finished together' : 'Friends read', value })
  }

  if (kind === 'study') {
    return (
      <CelebrationScaffold
        lamb={<LambView view="front" />}
        eyebrow={circle.name}
        headline="Study complete!"
        body={cs.data ? `${cs.data.study.title}, together.` : undefined}
        tiles={tiles}
        primary={{ label: 'Continue', onPress: onContinue }}
      />
    )
  }
  return (
    <CelebrationScaffold
      lamb={<LambView view="front" />}
      eyebrow={cs.data && day ? `Day ${day.day_number} of ${cs.data.study.total_days}` : undefined}
      headline="Faithful today!"
      body={
        day
          ? formatRef({ bookId: day.book_id, chapter: day.chapter, verseStart: day.verse_start, verseEnd: day.verse_end })
          : undefined
      }
      tiles={tiles}
      primary={{ label: 'Continue', onPress: onContinue }}
    />
  )
}
