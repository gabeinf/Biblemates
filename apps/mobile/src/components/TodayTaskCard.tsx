import { Pressable, StyleSheet, View } from 'react-native'
import { space } from '../theme'
import { AppText, Card, ChunkyButton } from './ui'

export type TodayTaskState =
  | { kind: 'start' }
  | { kind: 'continue'; step: number; of: number }
  | { kind: 'waiting'; name: string }
  | { kind: 'allDone' }

type Props = {
  title: string
  passage: string
  minutes: number
  state: TodayTaskState
  onStart: () => void
  onOpenBible: () => void
}

/** The Today hero (text only, no lamb): day title, passage, minutes, and the one call to action for the current state. */
export function TodayTaskCard({ title, passage, minutes, state, onStart, onOpenBible }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.text}>
        <AppText variant="headline" style={styles.center}>
          {title}
        </AppText>
        <AppText variant="body" color="textSecondary" style={styles.center}>
          {passage} · {minutes} min read
        </AppText>
      </View>
      {state.kind === 'start' && <ChunkyButton label="Start today's reading" onPress={onStart} />}
      {state.kind === 'continue' && <ChunkyButton label={`Continue, step ${state.step} of ${state.of}`} onPress={onStart} />}
      {state.kind === 'waiting' && (
        <AppText variant="callout">
          Done! Waiting on {state.name}
        </AppText>
      )}
      {state.kind === 'allDone' && (
        <AppText variant="callout">
          Whole flock read today
        </AppText>
      )}
      <Pressable hitSlop={8} onPress={onOpenBible} accessibilityRole="link" accessibilityLabel="Open in Bible">
        <AppText variant="callout" color="textSecondary">
          Open in Bible
        </AppText>
      </Pressable>
    </Card>
  )
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: space.sm },
  text: { gap: space.xs, alignItems: 'center' },
  center: { textAlign: 'center' },
})
