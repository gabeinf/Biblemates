import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useCircle, useCompletions, useDayReflections, useEncourage } from '../../../hooks/queries'
import { useUserId } from '../../../hooks/use-auth-context'
import { firstName } from '../../../lib/format'
import { isDayDone } from '../../../lib/study-day'
import { space } from '../../../theme'
import { NudgeSheet } from '../../NudgeSheet'
import { AppText, Card, Chibi, ChunkyButton, Reveal, type ChibiMood } from '../../ui'
import { Avatar } from '../../ui/legacy'
import type { StepProps } from './types'

/** Accountability beat: who finished, the circle's answers, a prayer nudge, or the invite code when solo. */
export function TogetherStep({ day, circleStudy, members, onReady }: StepProps) {
  const userId = useUserId()
  const circle = useCircle()
  const completions = useCompletions(circleStudy.id)
  const reflections = useDayReflections(circleStudy.id, day.day_number)
  const encourage = useEncourage()
  const [nudged, setNudged] = useState<string | null>(null)

  useEffect(() => {
    onReady(true)
  }, [onReady])

  const done = completions.data ?? []
  const others = members.filter((m) => m.user_id !== userId)
  const waiting = others.filter((m) => !isDayDone(done, m.user_id, day.day_number))
  const nameOf = (id: string) =>
    firstName(members.find((m) => m.user_id === id)?.profile?.display_name)
  // Only circle-visible answers, never private ones or my own.
  const answers = (reflections.data ?? []).filter(
    (r) => r.visibility === 'circle' && r.user_id !== userId,
  )
  const solo = others.length === 0
  const mood: ChibiMood = solo ? 'idle' : waiting.length === 0 ? 'cheer' : 'think'

  return (
    <View style={styles.root}>
      <Chibi
        mood={mood}
        size={96}
        message={
          mood === 'think'
            ? `Waiting on ${waiting.map((m) => firstName(m.profile?.display_name)).join(', ')}`
            : undefined
        }
      />
      {solo ? (
        <Card>
          <AppText variant="headline">Invite your circle</AppText>
          <AppText variant="body" color="textSecondary">
            Reading is better together. Share this code:
          </AppText>
          <AppText variant="title" accessibilityLabel={`Invite code ${circle.invite_code}`}>
            {circle.invite_code}
          </AppText>
        </Card>
      ) : (
        <>
          <View style={styles.row}>
            {members.map((m) => {
              const finished = m.user_id === userId || isDayDone(done, m.user_id, day.day_number)
              return (
                <View key={m.user_id} style={styles.person}>
                  <Avatar
                    name={m.profile?.display_name}
                    uri={m.profile?.avatar_url}
                    size={44}
                    dim={!finished}
                  />
                  <AppText variant="caption" color={finished ? 'text' : 'textSecondary'}>
                    {firstName(m.profile?.display_name)}
                  </AppText>
                </View>
              )
            })}
          </View>
          {answers.map((r, i) => (
            <Reveal key={r.id} delay={i * 80}>
              <Card>
                <AppText variant="label" color="textSecondary">
                  {nameOf(r.user_id)}
                </AppText>
                <AppText variant="body">{r.body}</AppText>
              </Card>
            </Reveal>
          ))}
          {waiting.map((m) => {
            const name = firstName(m.profile?.display_name)
            return (
              <ChunkyButton
                key={m.user_id}
                variant="secondary"
                label={`Pray for ${name}`}
                loading={encourage.isPending && encourage.variables?.toUser === m.user_id}
                onPress={() =>
                  encourage.mutate(
                    { circleId: circleStudy.circle_id, toUser: m.user_id, kind: 'praying' },
                    { onSuccess: () => setNudged(name) },
                  )
                }
              />
            )
          })}
        </>
      )}
      <NudgeSheet name={nudged} onClose={() => setNudged(null)} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  person: { alignItems: 'center', gap: space.xxs },
})
