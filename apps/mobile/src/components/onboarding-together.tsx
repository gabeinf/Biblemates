/**
 * Pieces for 08 · Together preview: a fanned stack of sample verse highlights, and a
 * "This week" card with each member's progress and the circle's streak.
 * Everything here is sample content: no real people or photos.
 */
import { useState } from 'react'
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { FadeIn } from './onboarding'
import { Avatar, ProgressTrack } from './ui'
import {
  colors,
  highlightColors,
  radii,
  spacing,
  typography,
  type HighlightColor,
} from '../theme/tokens'

export type SampleHighlight = {
  /** Optional sample reflection, shown on the front card when there's room. */
  reflection?: string
  name: string
  day: string
  verse: string
  reference: string
  color: HighlightColor
}

export type SampleMember = { name: string; read: number; goal: number }

/** Smallest height the stack needs; on taller screens it grows to fill spare room. */
const STACK_HEIGHT = 140
/** Horizontal room the fan needs beyond one card (back cards poke out each side). */
const FAN_SPREAD = 48
/** Vertical room the fan needs beyond one card (rotation and offsets). */
const FAN_PAD = 24
const CARD_WIDTH = { min: 220, max: 320, beforeLayout: 236 }
const MAX_CARD_HEIGHT = 300
/** The front card adds its reflection line once it's at least this tall. */
const REFLECTION_MIN_HEIGHT = 200
/** Back cards first, front card last, so the front one draws on top. */
const FAN = [
  { rotate: '-7deg', x: -18, y: 8 },
  { rotate: '5deg', x: 16, y: 4 },
  { rotate: '-1deg', x: 0, y: 0 },
]

/** A back card (`ghost`) shows highlight bars instead of text, so no clipped words peek out. */
function HighlightCard({
  h,
  ghost,
  size,
}: {
  h: SampleHighlight
  ghost?: boolean
  size: { width: number; height: number }
}) {
  const tint = { backgroundColor: highlightColors[h.color] }
  // Tall cards (spare height on big screens) set the verse larger and add the reflection.
  const tall = size.height >= REFLECTION_MIN_HEIGHT
  const showReflection = !ghost && !!h.reflection && tall
  return (
    <View style={[styles.preview, { width: size.width, minHeight: size.height }]}>
      <View style={styles.previewHead}>
        <Avatar name={h.name} size={28} />
        <Text style={styles.previewName}>{ghost ? '' : h.name.split(' ')[0]}</Text>
        <Text style={styles.previewDay}>{ghost ? '' : h.day}</Text>
      </View>
      {ghost ? (
        <View style={styles.bars}>
          <View style={[styles.bar, tint]} />
          <View style={[styles.bar, tint]} />
          <View style={[styles.bar, styles.barShort, tint]} />
        </View>
      ) : (
        <>
          <Text style={[styles.verse, tall && styles.verseTall]} numberOfLines={tall ? 5 : 3}>
            <Text style={tint}>{h.verse}</Text>
          </Text>
          <Text style={styles.reference}>{h.reference}</Text>
          {showReflection ? <Text style={styles.reflection}>“{h.reflection}”</Text> : null}
        </>
      )}
    </View>
  )
}

/**
 * Card size for a stack laid out in `box`: as wide as the fan allows, and tall enough
 * to fill spare height on tall screens (portrait cards, like a hand of photos).
 * Before layout, and on short screens, cards keep their natural height (`height` 0).
 */
export function stackCardSize(box: { width: number; height: number }) {
  if (box.width === 0) return { width: CARD_WIDTH.beforeLayout, height: 0 }
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
  return {
    width: clamp(box.width - FAN_SPREAD, CARD_WIDTH.min, CARD_WIDTH.max),
    height: clamp(box.height - FAN_PAD, 0, MAX_CARD_HEIGHT),
  }
}

/** Up to three sample highlights fanned out like a hand of cards. */
export function PreviewStack({ highlights }: { highlights: readonly SampleHighlight[] }) {
  const shown = highlights.slice(0, FAN.length)
  const fan = FAN.slice(FAN.length - shown.length)
  const front = shown[shown.length - 1]
  const [box, setBox] = useState({ width: 0, height: 0 })
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setBox({ width: Math.round(width), height: Math.round(height) })
  }
  if (!front) return null
  const size = stackCardSize(box)
  return (
    <View
      style={styles.stack}
      onLayout={onLayout}
      accessible
      accessibilityLabel={`Example: ${front.name.split(' ')[0]} highlighted ${front.reference}`}
    >
      <View style={styles.centered}>
        {shown.map((h, i) => (
          // FadeIn sets its own transform, so the fan angle goes on the view inside it.
          <FadeIn key={h.reference} delay={i * 120} style={styles.fanned}>
            <View
              style={{
                transform: [
                  { translateX: fan[i].x },
                  { translateY: fan[i].y },
                  { rotate: fan[i].rotate },
                ],
              }}
            >
              <HighlightCard h={h} ghost={i < shown.length - 1} size={size} />
            </View>
          </FadeIn>
        ))}
      </View>
    </View>
  )
}

export function ThisWeekCard({
  members,
  streakWeeks,
}: {
  members: readonly SampleMember[]
  streakWeeks: number
}) {
  return (
    <View style={styles.week}>
      <View style={styles.weekHead}>
        <Text style={styles.weekTitle}>This week</Text>
        <View style={styles.chip} accessible accessibilityLabel={`${streakWeeks}-week streak`}>
          <Ionicons name="flame" size={14} color={colors.Gold} />
          <Text style={styles.chipText}>{streakWeeks}-week streak</Text>
        </View>
      </View>
      {members.map((m) => (
        <View
          key={m.name}
          style={styles.member}
          accessible
          accessibilityLabel={`${m.name}: ${m.read} of ${m.goal} readings`}
        >
          <Avatar name={m.name} size={36} />
          <View style={styles.memberBody}>
            <View style={styles.memberRow}>
              <Text style={styles.memberName}>{m.name}</Text>
              <Text style={styles.count}>
                {m.read}/{m.goal}
              </Text>
            </View>
            <ProgressTrack value={m.goal > 0 ? (m.read / m.goal) * 100 : 0} />
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  // Takes any spare height on tall screens (StepScreen's content grows to fill).
  stack: { flexGrow: 1, minHeight: STACK_HEIGHT },
  centered: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  fanned: { position: 'absolute' },
  preview: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xxs,
  },
  previewHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  previewName: {
    flex: 1,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.Ink,
  },
  previewDay: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
  },
  verse: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.bodySmall,
    lineHeight: Math.round(typography.fontSize.bodySmall * 1.3),
    color: colors.Ink,
  },
  verseTall: {
    paddingVertical: spacing.xs,
    fontSize: typography.fontSize.subTitle,
    lineHeight: Math.round(typography.fontSize.subTitle * 1.3),
  },
  reflection: {
    marginTop: 'auto',
    paddingTop: spacing.sm,
    fontFamily: typography.fontFamily.bodyItalic,
    fontSize: typography.fontSize.caption,
    lineHeight: Math.round(typography.fontSize.caption * 1.5),
    color: colors.muted,
  },
  bars: { gap: spacing.xs, paddingVertical: spacing.xxs },
  bar: { height: spacing.sm, borderRadius: radii.xs },
  barShort: { width: '60%' },
  reference: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
  },
  week: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  weekHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weekTitle: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.bodySmall,
    color: colors.Ink,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
    backgroundColor: colors.goldSoft,
  },
  chipText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.Gold,
  },
  member: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberBody: { flex: 1, gap: spacing.xxs },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between' },
  memberName: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.Ink,
  },
  count: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.success,
  },
})
