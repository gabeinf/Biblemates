import { useEffect, useState } from 'react'
import { useReducedMotion } from 'react-native-reanimated'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CelebrationScaffold, Chibi, haptic, LambView, SeedIcon, type Tile } from '../../components/ui'
import { useCircle, useCircleStudy, useCompletions, useMembers, useSeedsEarnedToday } from '../../hooks/queries'
import { useUserId } from '../../hooks/use-auth-context'
import { formatRef } from '../../constants/books'
import { currentDay, currentDayNumber, isDayDone } from '../../lib/study-day'
import { currentStreak } from '../../lib/streak'
import { celebrationClosed } from '../../lib/celebrations'

const COUNT_MS = 700
const MAX_STEPS = 14

/** 0 → `target` in even steps: a light tick per step, success on the last. Reduce Motion: `target` at once, one success. */
function useSeedCount(target: number) {
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? target : 0)
  useEffect(() => {
    if (reduce) {
      haptic.success()
      return
    }
    const steps = Math.min(target, MAX_STEPS)
    let i = 0
    const timer = setInterval(() => {
      i += 1
      setN(Math.round((target * i) / steps))
      if (i >= steps) {
        clearInterval(timer)
        haptic.success()
      } else haptic.tap()
    }, COUNT_MS / steps)
    return () => clearInterval(timer)
  }, [reduce, target])
  return n
}

function SeedsPhase({ seeds, onContinue }: { seeds: number; onContinue: () => void }) {
  const count = useSeedCount(seeds)
  return (
    <CelebrationScaffold
      silent
      lamb={<SeedIcon size={120} />}
      eyebrow="Seeds earned"
      headline={`+${count}`}
      body="For showing up today."
      primary={{ label: 'Continue', onPress: onContinue }}
    />
  )
}

/**
 * Full-screen success moment. `kind=checkin`: I just marked today's reading read (after
 * `useMarkDayComplete`): congrats first, then a seeds phase, then the Pasture tab. `kind=study`: the whole circle finished the study (activity `milestone`).
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
  const [phase, setPhase] = useState<'congrats' | 'seeds'>('congrats')
  const toPasture = () => router.dismissTo('/pasture')
  const onContinue = shown === 'checkin' && seeds > 0 && phase === 'congrats' ? () => setPhase('seeds') : toPasture
  if (phase === 'seeds') return <SeedsPhase seeds={seeds} onContinue={toPasture} />

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
