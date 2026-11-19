/**
 * 04 · Consistency proof. Shows that reading with others outlasts reading alone.
 * See docs/specs/onboarding.md → "04 · Consistency proof".
 */
import { StyleSheet, Text } from 'react-native'
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { ChartCard } from '../../../components/onboarding-chart'
import { StepHeading, StepScreen } from '../../../components/onboarding-step'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import {
  PROOF_ALONE,
  PROOF_CAPTION,
  PROOF_CIRCLE,
  PROOF_STAT,
  PROOF_WEEKS,
} from '../../../lib/onboarding-proof'
import { colors, spacing, typography } from '../../../theme/tokens'

const SERIES = [
  { label: 'With your circle', values: PROOF_CIRCLE, color: colors.Gold, emphasis: true },
  { label: 'On your own', values: PROOF_ALONE, color: colors.muted },
]

export default function ConsistencyProof() {
  const { goNext } = useOnboardingNav()

  return (
    <StepScreen footer={<Button label="Show me how" size="lg" onPress={() => goNext()} />}>
      <FadeIn>
        <StepHeading title="Read together," muted="keep going." />
      </FadeIn>

      <FadeIn delay={120}>
        <ChartCard
          title="Weeks you keep reading"
          series={SERIES}
          startLabel="Week 1"
          endLabel={`Week ${PROOF_WEEKS}`}
          description={`Illustration over ${PROOF_WEEKS} weeks: reading with your circle stays steady, while reading on your own drops off.`}
        />
      </FadeIn>

      <FadeIn delay={200} style={styles.stat}>
        <Text style={styles.statLine}>{PROOF_STAT}</Text>
        <Text style={styles.caption}>{PROOF_CAPTION}</Text>
      </FadeIn>
    </StepScreen>
  )
}

const styles = StyleSheet.create({
  stat: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  statLine: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.subTitle,
    color: colors.Gold,
    textAlign: 'center',
  },
  caption: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    lineHeight: Math.round(typography.fontSize.caption * 1.5),
    color: colors.muted,
    textAlign: 'center',
  },
})
