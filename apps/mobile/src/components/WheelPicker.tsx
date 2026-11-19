/**
 * Vertical wheel picker: rows snap into a centre band framed by hairlines. Works with
 * touch, the mouse wheel on web (snaps once scrolling settles) and screen-reader
 * increment/decrement. Built on ScrollView, so no extra dependency.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native'
import { wheelIndex } from '../lib/wheel'
import { colors, spacing, typography } from '../theme/tokens'

const ROW = spacing.xxxl
const VISIBLE = 5
const PAD = ROW * Math.floor(VISIBLE / 2)
const WEB_SETTLE_MS = 140

type Props = {
  values: readonly number[]
  value: number
  onChange: (value: number) => void
  /** Text shown after the selected value, e.g. "days". */
  suffix?: (value: number) => string
  /** What the picker sets, for screen readers ("Days per week"). */
  label: string
}

export function WheelPicker({ values, value, onChange, suffix, label }: Props) {
  const scroll = useRef<ScrollViewInstance>(null)
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [index, setIndexState] = useState(() => Math.max(0, values.indexOf(value)))
  // Mirrors `index` so the sync effect below can skip no-op scrolls without re-running.
  const indexRef = useRef(index)
  const setIndex = useCallback((i: number) => {
    indexRef.current = i
    setIndexState(i)
  }, [])

  const scrollToIndex = useCallback((i: number, animated: boolean) => {
    scroll.current?.scrollTo({ y: i * ROW, animated })
  }, [])

  // Keep the wheel in line when `value` changes from outside the wheel.
  useEffect(() => {
    const i = values.indexOf(value)
    if (i >= 0 && i !== indexRef.current) {
      setIndex(i)
      scrollToIndex(i, true)
    }
  }, [value, values, scrollToIndex, setIndex])

  useEffect(() => () => {
    if (settle.current) clearTimeout(settle.current)
  }, [])

  const commit = useCallback(
    (i: number) => {
      setIndex(i)
      if (values[i] !== value) onChange(values[i])
    },
    [onChange, setIndex, value, values],
  )

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y
    const i = wheelIndex(y, ROW, values.length)
    if (i !== index) setIndex(i)
    // Web has no momentum-end event or native snapping, so snap once scrolling settles.
    if (Platform.OS === 'web') {
      if (settle.current) clearTimeout(settle.current)
      settle.current = setTimeout(() => {
        scrollToIndex(i, true)
        commit(i)
      }, WEB_SETTLE_MS)
    }
  }

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    commit(wheelIndex(e.nativeEvent.contentOffset.y, ROW, values.length))
  }

  // A drag released without a flick has no momentum phase, so it settles here.
  const onDragEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Math.abs(e.nativeEvent.velocity?.y ?? 0) < 0.05) onScrollEnd(e)
  }

  // Screen-reader adjust: read the ref (not render state, which lags mid-animation) and
  // jump without animating so the announced value is the final one.
  const step = (delta: number) => {
    const i = Math.min(values.length - 1, Math.max(0, indexRef.current + delta))
    scrollToIndex(i, false)
    commit(i)
  }

  const current = values[index]
  const spoken = suffix ? `${current} ${suffix(current)}` : String(current)

  return (
    <View
      style={styles.wheel}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: values[0], max: values.at(-1), now: current, text: spoken }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
    >
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={onScroll}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onDragEnd}
        onLayout={() => scrollToIndex(index, false)}
        contentContainerStyle={{ paddingVertical: PAD }}
      >
        {values.map((v, i) => {
          const distance = Math.abs(i - index)
          return (
            <Pressable
              key={v}
              onPress={() => {
                scrollToIndex(i, true)
                commit(i)
              }}
              style={styles.row}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            >
              <Text
                style={[
                  styles.number,
                  distance === 0 ? styles.selected : { opacity: distance === 1 ? 0.55 : 0.3 },
                ]}
              >
                {v}
              </Text>
              {distance === 0 && suffix ? <Text style={styles.suffix}>{suffix(v)}</Text> : null}
            </Pressable>
          )
        })}
      </ScrollView>
      {/* The centre band: the selected row sits between these two hairlines. */}
      <View pointerEvents="none" style={[styles.hairline, { top: PAD }]} />
      <View pointerEvents="none" style={[styles.hairline, { top: PAD + ROW }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  wheel: { height: ROW * VISIBLE, alignSelf: 'stretch' },
  row: { height: ROW, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingTop: spacing.xxs },
  number: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.display,
    lineHeight: ROW - spacing.xxs,
    color: colors.muted,
    fontVariant: ['lining-nums'],
    minWidth: 40,
    textAlign: 'center',
  },
  selected: { color: colors.Ink },
  suffix: {
    position: 'absolute',
    left: '50%',
    marginLeft: spacing.xl,
    bottom: spacing.sm,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.subTitle,
    color: colors.muted,
  },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
})
