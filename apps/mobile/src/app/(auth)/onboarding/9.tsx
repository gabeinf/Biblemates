/**
 * 09 · Payoff + fork. The "after" of the hook (02): the same two-panel card, now with
 * everyone reading, then a split between starting a circle and joining one.
 * See docs/specs/onboarding.md → "09 · Payoff + fork".
 */
import { StyleSheet, Text, View } from 'react-native'
import { Avatar, Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { StepScreen } from '../../../components/onboarding-step'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { HOOK_READERS } from '../../../lib/onboarding-flow'
import { colors, radii, spacing, typography } from '../../../theme/tokens'

/** Same composition as 02's card, but both panels are full: it still reads, week after week. */
const PAYOFF_WEEKS = ['Week 1', 'Week 3'] as const
const DAYS = Array.from({ length: 7 })

function WeekPanel({ label }: { label: string }) {
  return (
    <View
      style={styles.panel}
      accessible
      accessibilityLabel={`${label}: ${HOOK_READERS.length * DAYS.length} of ${HOOK_READERS.length * DAYS.length} readings done`}
    >
      <Text style={styles.panelLabel}>{label}</Text>
      <View style={styles.rows}>
        {HOOK_READERS.map((name) => (
          <View key={name} style={styles.row}>
            <Avatar name={name} size={AVATAR} />
            <View style={styles.days}>
              {DAYS.map((_, d) => (
                <View key={d} style={styles.day} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

export default function PayoffFork() {
  const { goNext } = useOnboardingNav()

  return (
    <StepScreen
      mascot
      footer={
        <>
          <Text style={styles.headline} accessibilityRole="header">
            {'We all start the plan together…\n'}
            <Text style={styles.headlineGold}>and keep going.</Text>
          </Text>
          <Button
            label="I have an invite code"
            variant="outline"
            size="lg"
            onPress={() => goNext({ path: 'join' })}
          />
          <Button
            label="Start a circle plan"
            size="lg"
            // A user who went back from the join branch may have a code saved; drop it.
            onPress={() => goNext({ path: 'create', inviteCode: undefined })}
          />
        </>
      }
    >
      <FadeIn>
        <View style={styles.card}>
          {PAYOFF_WEEKS.map((label, i) => (
            <View key={label} style={styles.panelWrap}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <WeekPanel label={label} />
            </View>
          ))}
        </View>
      </FadeIn>
    </StepScreen>
  )
}

const AVATAR = 18
const DAY = 9

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  panelWrap: { flex: 1, flexDirection: 'row' },
  divider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
  },
  panel: { flex: 1, alignItems: 'center', gap: spacing.md },
  panelLabel: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.subTitle,
    color: colors.Ink,
  },
  rows: { gap: spacing.sm, alignSelf: 'stretch', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  days: { flexDirection: 'row', gap: spacing.xxs },
  day: { width: DAY, height: DAY, borderRadius: radii.full, backgroundColor: colors.Gold },
  headline: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    lineHeight: Math.round(typography.fontSize.title * 1.15),
    color: colors.Ink,
    marginBottom: spacing.sm,
  },
  headlineGold: { color: colors.Gold },
})
