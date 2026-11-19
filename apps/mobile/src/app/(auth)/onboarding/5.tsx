/**
 * 05 · Voices. Reassurance from people reading with their circle.
 * See docs/specs/onboarding.md → "05 · Voices (social proof)".
 */
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { StepHeading, StepScreen } from '../../../components/onboarding-step'
import { Stars, TestimonialCard } from '../../../components/onboarding-testimonial'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { SAMPLE_TESTIMONIALS, TESTIMONIALS } from '../../../lib/testimonials'
import { colors, spacing, typography } from '../../../theme/tokens'

export default function Voices() {
  const { goNext } = useOnboardingNav()

  return (
    <StepScreen fade footer={<Button label="Continue" size="lg" onPress={() => goNext()} />}>
      <FadeIn style={styles.intro}>
        <Stars size={22} />
        <StepHeading
          title="Not alone in this"
          subtitle="What changes when a few friends read alongside you."
          align="center"
        />
      </FadeIn>

      <FadeIn delay={120} style={styles.list}>
        {SAMPLE_TESTIMONIALS ? (
          <View style={styles.note}>
            <Text style={styles.noteText}>
              Sample stories for now. Real ones, shared with permission, are on the way.
            </Text>
          </View>
        ) : null}
        {TESTIMONIALS.map((t) => (
          <TestimonialCard key={t.id} testimonial={t} />
        ))}
      </FadeIn>
    </StepScreen>
  )
}

const styles = StyleSheet.create({
  intro: { alignItems: 'center', gap: spacing.sm },
  list: { gap: spacing.sm },
  note: { paddingHorizontal: spacing.md },
  noteText: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
    textAlign: 'center',
  },
})
