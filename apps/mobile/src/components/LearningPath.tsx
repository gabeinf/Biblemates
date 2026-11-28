import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons'
import { motion, radius, space, useTheme } from '../theme'
import { AppText, Avatar, haptic, type DayState } from './ui'

const NODE = 64
const TODAY_NODE = 88
const SWING = 44
/** Horizontal offset per row, in SWING units: a gentle left-right zigzag. */
const ZIGZAG = [0, 1, 2, 1, 0, -1, -2, -1]

export type PathPartner = { id: string; name?: string | null; uri?: string | null }

type Props = {
  /** One state per study day, day 1 first. */
  days: readonly DayState[]
  /** 1-based number of today's day. */
  todayNumber: number
  /** Bubble above today's node while it is still to do: "Start" or "Continue, step N of 4". */
  bubble: string
  /** Short line under today's node once I am done. */
  caption?: string
  /** Partners who finished today: avatars with a tick on today's node. */
  partners: readonly PathPartner[]
  onStartToday: () => void
  /** Vertical centre of today's node inside the path, once laid out (the screen scrolls to it). */
  onTodayLayout?: (centerY: number) => void
}

function Node({
  day,
  state,
  today,
  bubble,
  partners,
  onPress,
}: {
  day: number
  state: DayState
  today: boolean
  bubble: string
  partners: readonly PathPartner[]
  onPress: () => void
}) {
  const theme = useTheme()
  const reduce = useReducedMotion()
  const scale = useSharedValue(1)
  const pulse = useSharedValue(1)
  const pending = today && state === 'today'

  useEffect(() => {
    if (pending && !reduce)
      pulse.set(
        withRepeat(
          withSequence(withTiming(1.06, { duration: 900 }), withTiming(1, { duration: 900 })),
          -1,
        ),
      )
  }, [pending, reduce, pulse])
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value * pulse.value }] }))

  const size = today ? TODAY_NODE : NODE
  const face = {
    done: theme.primary,
    today: theme.primary,
    missed: theme.surfaceSunken,
    future: theme.disabledFill,
  }[state]
  const lip = {
    done: theme.primaryLip,
    today: theme.primaryLip,
    missed: theme.border,
    future: theme.border,
  }[state]
  const ink = state === 'done' || state === 'today' ? theme.onPrimary : theme.textTertiary
  const label = `Day ${day}, ${{ done: 'done', today: 'today', missed: 'missed', future: 'locked' }[state]}`
  const tappable = pending

  return (
    <View
      style={[
        styles.row,
        { transform: [{ translateX: ZIGZAG[(day - 1) % ZIGZAG.length] * SWING }] },
      ]}
    >
      {pending && (
        <View
          style={[styles.bubble, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <AppText variant="button" color="primary">
            {bubble}
          </AppText>
        </View>
      )}
      <Pressable
        disabled={!tappable}
        onPress={onPress}
        onPressIn={() => {
          if (!tappable) return
          haptic.tap()
          scale.set(reduce ? 1 : withTiming(motion.pressScale, { duration: motion.duration.press }))
        }}
        onPressOut={() => scale.set(reduce ? 1 : withSpring(1, motion.spring.snap))}
        accessibilityRole={tappable ? 'button' : 'image'}
        accessibilityLabel={label}
        accessibilityState={{ disabled: !tappable }}
        hitSlop={8}
      >
        <Animated.View
          style={[
            styles.node,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: face,
              borderColor: lip,
            },
            anim,
          ]}
        >
          {state === 'done' && <Ionicons name="checkmark" size={size * 0.5} color={ink} />}
          {state === 'today' && <Ionicons name="book" size={size * 0.4} color={ink} />}
          {state === 'future' && <Ionicons name="lock-closed" size={size * 0.34} color={ink} />}
          {state === 'missed' && (
            <View testID={`missed-dot-${day}`} style={[styles.dot, { backgroundColor: ink }]} />
          )}
          {partners.length > 0 && (
            <View style={styles.partners} testID="path-partners">
              {partners.map((p) => (
                <View
                  key={p.id}
                  style={[styles.partner, { borderColor: theme.surface }]}
                  accessibilityLabel={`${p.name ?? 'A friend'} finished`}
                >
                  <Avatar name={p.name} uri={p.uri} size={26} />
                  <View
                    style={[
                      styles.tick,
                      { backgroundColor: theme.success, borderColor: theme.surface },
                    ]}
                  >
                    <Ionicons name="checkmark" size={9} color={theme.onPrimary} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </Pressable>
    </View>
  )
}

/** The Today path: one circular node per study day in a zigzag. Only today's node is tappable. */
export function LearningPath({
  days,
  todayNumber,
  bubble,
  caption,
  partners,
  onStartToday,
  onTodayLayout,
}: Props) {
  return (
    <View style={styles.path} testID="learning-path">
      {days.map((state, i) => {
        const day = i + 1
        const today = day === todayNumber
        return (
          <View
            key={day}
            testID={`path-day-${day}`}
            style={styles.cell}
            onLayout={today ? (e) => onTodayLayout?.(e.nativeEvent.layout.y + e.nativeEvent.layout.height / 2) : undefined}
          >
            <Node
              day={day}
              state={state}
              today={today}
              bubble={bubble}
              partners={today ? partners : []}
              onPress={onStartToday}
            />
            {today && !!caption && (
              <AppText variant="callout" color="textSecondary" style={styles.caption}>
                {caption}
              </AppText>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  path: { alignItems: 'center', paddingVertical: space.lg },
  cell: { alignItems: 'center', paddingVertical: space.sm },
  row: { alignItems: 'center', gap: space.xs },
  node: { alignItems: 'center', justifyContent: 'center', borderBottomWidth: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bubble: {
    borderWidth: 2,
    borderRadius: radius.lg,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  caption: { textAlign: 'center', marginTop: space.xs },
  partners: { position: 'absolute', right: -space.md, top: -space.xs, flexDirection: 'row' },
  partner: { borderWidth: 2, borderRadius: radius.pill, marginLeft: -6 },
  tick: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
