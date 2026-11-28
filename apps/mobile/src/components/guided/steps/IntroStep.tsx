import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { formatRef } from '../../../constants/books'
import { useCircle, useCompletions } from '../../../hooks/queries'
import { useUserId } from '../../../hooks/use-auth-context'
import { firstName } from '../../../lib/format'
import { slippedYesterday } from '../../../lib/missed-day'
import { SEEDS_PER_DAY } from '../../../lib/seeds'
import { isDayDone } from '../../../lib/study-day'
import { space } from '../../../theme'
import { AppText, Card, Chibi, SeedIcon } from '../../ui'
import type { StepProps } from './types'

/** Opening beat: greeting, today's passage, the seeds on offer and who already finished. */
export function IntroStep({ day, circleStudy, members, onReady }: StepProps) {
  const userId = useUserId()
  const circle = useCircle()
  const completions = useCompletions(circleStudy.id)

  useEffect(() => {
    onReady(true)
  }, [onReady])

  const done = completions.data ?? []
  const me = members.find((m) => m.user_id === userId)
  const name = firstName(me?.profile?.display_name)
  const finished = members
    .filter((m) => m.user_id !== userId && isDayDone(done, m.user_id, day.day_number))
    .map((m) => firstName(m.profile?.display_name))
  // Wait for completions: an empty list while loading would read as "slipped".
  const slipped = completions.data ? slippedYesterday(done, userId, day.day_number) : false
  const ref = formatRef({
    bookId: day.book_id,
    chapter: day.chapter,
    verseStart: day.verse_start,
    verseEnd: day.verse_end,
  })

  return (
    <View style={styles.root}>
      <Chibi
        mood="idle"
        size={96}
        message={
          slipped
            ? `Welcome back, ${name}. No pressure, let's pick it up together.`
            : `Hi ${name}, ready for today?`
        }
      />
      <Card>
        <AppText variant="title">{day.title}</AppText>
        <AppText variant="body">{ref}</AppText>
        <AppText variant="caption" color="textSecondary">{`${day.read_minutes} min read`}</AppText>
      </Card>
      <View style={styles.row}>
        <SeedIcon size={24} />
        <AppText variant="label">{`${SEEDS_PER_DAY} seeds for finishing today`}</AppText>
      </View>
      {finished.length > 0 ? (
        <AppText variant="body" color="textSecondary">
          {`${finished.join(', ')} already finished today`}
        </AppText>
      ) : null}
      {circle.stakes_label ? (
        <AppText variant="caption" color="textSecondary">
          {`This week's stakes: ${circle.stakes_label}`}
        </AppText>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
})
