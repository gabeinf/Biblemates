/**
 * Illustrative Mon–Sun grid for 06: one row per reader, read days checked. The checks
 * pop in one after another (static under Reduce Motion). Not interactive.
 */
import { useEffect, useState } from 'react'
import { Animated, StyleSheet, Text, View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useReducedMotion } from 'react-native-reanimated'
import { weekdayInitials, weekdayNames } from '../lib/weekdays'
import { colors, radii, spacing, typography } from '../theme/tokens'

export type WeekRow = { label: string; days: readonly boolean[] }

const CHECK = 26
const DOT = 6
const LABEL_WIDTH = 88
const STAGGER_MS = 140

/** "You: read Monday, Tuesday and Wednesday" style summary for screen readers. */
export function rowSummary(row: WeekRow, names: readonly string[]): string {
  const read = names.filter((_, i) => row.days[i])
  if (read.length === 0) return `${row.label}: no days read yet`
  const list =
    read.length === 1 ? read[0] : `${read.slice(0, -1).join(', ')} and ${read[read.length - 1]}`
  return `${row.label}: read ${list}`
}

/** `rows` must not change after mount: one animation is created per check. */
export function WeekGrid({ rows, footnote }: { rows: readonly WeekRow[]; footnote: string }) {
  const reduceMotion = useReducedMotion()
  const initials = weekdayInitials()
  // The summary sentence is English, so the day names in it are too.
  const names = weekdayNames('en-US')
  const checkedCount = rows.reduce((n, r) => n + r.days.filter(Boolean).length, 0)
  const [pops] = useState(() => Array.from({ length: checkedCount }, () => new Animated.Value(0)))

  useEffect(() => {
    if (reduceMotion) {
      pops.forEach((p) => p.setValue(1))
      return
    }
    const anim = Animated.stagger(
      STAGGER_MS,
      pops.map((p) =>
        Animated.spring(p, { toValue: 1, friction: 6, tension: 120, useNativeDriver: true }),
      ),
    )
    const start = setTimeout(() => anim.start(), 350)
    return () => {
      clearTimeout(start)
      anim.stop()
    }
  }, [reduceMotion, pops])

  // Checks animate in reading order: row by row, Monday to Sunday.
  let next = 0

  return (
    <View style={styles.card}>
      <View
        style={styles.row}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <View style={styles.label} />
        {initials.map((d, i) => (
          <Text key={i} style={styles.dayInitial}>
            {d}
          </Text>
        ))}
      </View>
      {rows.map((row) => (
        <View
          key={row.label}
          style={styles.row}
          accessible
          accessibilityLabel={rowSummary(row, names)}
        >
          <Text style={[styles.label, styles.labelText]} numberOfLines={1}>
            {row.label}
          </Text>
          {row.days.map((done, i) => {
            if (!done) {
              return (
                <View key={i} style={styles.cell}>
                  <View style={styles.dot} />
                </View>
              )
            }
            const p = pops[next++]
            return (
              <View key={i} style={styles.cell}>
                <Animated.View
                  testID="week-check"
                  style={[styles.check, { opacity: p, transform: [{ scale: p }] }]}
                >
                  <Ionicons name="checkmark" size={CHECK * 0.6} color={colors.surface} />
                </Animated.View>
              </View>
            )
          })}
        </View>
      ))}
      <View style={styles.divider} />
      <Text style={styles.footnote}>{footnote}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { width: LABEL_WIDTH },
  labelText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  dayInitial: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
  },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', height: CHECK },
  dot: { width: DOT, height: DOT, borderRadius: radii.full, backgroundColor: colors.inactive },
  check: {
    width: CHECK,
    height: CHECK,
    borderRadius: radii.full,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  footnote: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    lineHeight: Math.round(typography.fontSize.caption * 1.5),
    color: colors.muted,
    textAlign: 'center',
  },
})
