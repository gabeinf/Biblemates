import { StyleSheet, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { space, useTheme } from '../../theme'
import { WEEKDAY_INITIALS_FALLBACK } from '../../lib/weekdays'
import { AppText } from './AppText'

export type DayState = 'done' | 'today' | 'future'
const SIZE = 36

/** 7 day circles: done = ember fill + white check, today = ember ring, future = line ring. */
export function StreakWeek({ days, labels = WEEKDAY_INITIALS_FALLBACK }: { days: readonly DayState[]; labels?: readonly string[] }) {
  const theme = useTheme()
  const done = days.filter((d) => d === 'done').length
  return (
    <View accessible accessibilityLabel={`${done} of ${days.length} days done this week`} style={styles.row}>
      {days.map((d, i) => (
        <View key={i} style={styles.col}>
          <View
            style={[
              styles.dot,
              d === 'done' && { backgroundColor: theme.streak, borderColor: theme.streak },
              d === 'today' && { borderColor: theme.streak },
              d === 'future' && { borderColor: theme.border },
            ]}
          >
            {d === 'done' && <Ionicons name="checkmark" size={20} color={theme.onPrimary} />}
          </View>
          <AppText variant="caption" color="textSecondary">
            {labels[i]}
          </AppText>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { alignItems: 'center', gap: space.xxs },
  dot: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
})
