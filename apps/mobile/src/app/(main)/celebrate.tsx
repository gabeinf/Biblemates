import { useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CelebrationScaffold, Chibi, LambView, SeedIcon, type Tile } from '../../components/ui'
import { useCircle, useCircleStudy, useCompletions, useMembers, useSeedsEarnedToday } from '../../hooks/queries'
import { useUserId } from '../../hooks/use-auth-context'
import { formatRef } from '../../constants/books'
import { currentDay, currentDayNumber, isDayDone } from '../../lib/study-day'
import { currentStreak } from '../../lib/streak'
import { celebrationClosed } from '../../lib/celebrations'

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

  const seeds = useSeedsEarnedToday().data ?? 0
  const memberList = members.data ?? []
  const done = completions.data ?? []
  const day = cs.data ? currentDay(cs.data) : undefined
  const dayNumber = cs.data ? currentDayNumber(cs.data) : undefined
  const readToday = memberList.filter((m) => !!dayNumber && isDayDone(done, m.user_id, dayNumber)).length
  const streak = currentStreak(done.filter((c) => c.user_id === userId).map((c) => c.completed_at))
  const shown = kind === 'study' ? 'study' : 'checkin'
  useEffect(() => () => celebrationClosed(shown), [shown])
  const onContinue = () => router.dismissTo('/today')

  const tiles: Tile[] = []
  if (kind !== 'study' && streak > 0) tiles.push({ kind: 'streak', label: 'Streak', value: streak })
  if (kind !== 'study' && seeds > 0) {
    tiles.push({ kind: 'seed', label: 'Seeds', value: seeds, icon: <SeedIcon size={22} />, countUp: true })
  }
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
      lamb={<Chibi mood="cheer" />}
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
