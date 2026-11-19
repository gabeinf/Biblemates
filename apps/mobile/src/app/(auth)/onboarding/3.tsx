/**
 * 03 · Intent. Asks why they came, to personalize the first study and later copy.
 * See docs/specs/onboarding.md → "03 · Intent".
 */
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { ChoiceRow } from '../../../components/onboarding-choice'
import { StepHeading, StepScreen } from '../../../components/onboarding-step'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { getDraft } from '../../../lib/onboarding-draft'
import {
  INTENT_OPTIONS,
  INTENT_VERSE,
  INTENT_VERSE_REFERENCE,
  validIntent,
} from '../../../lib/onboarding-intent'
import { colors, spacing, typography } from '../../../theme/tokens'

export default function Intent() {
  const { goNext } = useOnboardingNav()
  // Coming back from 04 keeps the earlier answer selected.
  const [intent, setIntent] = useState(() => validIntent(getDraft().intent))

  return (
    <StepScreen
      footer={
        <Button
          label="Continue"
          size="lg"
          disabled={intent === null}
          onPress={() => intent && goNext({ intent })}
        />
      }
    >
      <FadeIn style={styles.intro}>
        <StepHeading title="What’s drawing you here?" align="center" />
        <View style={styles.verse}>
          <Text style={styles.verseText}>“{INTENT_VERSE}”</Text>
          <Text style={styles.verseRef}>{INTENT_VERSE_REFERENCE}</Text>
        </View>
      </FadeIn>

      <FadeIn delay={120}>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {INTENT_OPTIONS.map((o) => (
            <ChoiceRow
              key={o.id}
              label={o.label}
              icon={o.icon}
              selected={intent === o.id}
              onPress={() => setIntent(o.id)}
            />
          ))}
        </View>
      </FadeIn>
    </StepScreen>
  )
}

const styles = StyleSheet.create({
  intro: { gap: spacing.md },
  verse: { alignItems: 'center', gap: spacing.xxs },
  verseText: {
    fontFamily: typography.fontFamily.bodyItalic,
    fontSize: typography.fontSize.bodySmall,
    lineHeight: Math.round(typography.fontSize.bodySmall * 1.4),
    color: colors.Gold,
    textAlign: 'center',
  },
  verseRef: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
  },
  options: { gap: spacing.sm },
})
