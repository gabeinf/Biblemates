/**
 * 10 · Days per week. Sets the circle's weekly reading goal.
 * See docs/specs/onboarding.md → "10 · Days per week".
 */
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { WheelPicker } from '../../../components/WheelPicker'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { getDraft, updateDraft } from '../../../lib/onboarding-draft'
import { DAYS_OPTIONS, DEFAULT_DAYS, daysSuffix } from '../../../lib/wheel'
import { colors, spacing, typography } from '../../../theme/tokens'

export default function DaysPerWeek() {
  const { goNext } = useOnboardingNav()
  const [days, setDays] = useState(() => getDraft().daysPerWeek ?? DEFAULT_DAYS)

  return (
    <View style={styles.screen}>
      <FadeIn>
        <Text style={styles.title} accessibilityRole="header">
          How many days a week will you read?
        </Text>
      </FadeIn>

      <FadeIn delay={80} style={styles.center}>
        <WheelPicker
          values={DAYS_OPTIONS}
          value={days}
          onChange={(n) => {
            setDays(n)
            // Save as it changes, so going back and forward keeps the answer.
            updateDraft({ daysPerWeek: n })
          }}
          suffix={daysSuffix}
          label="Days per week"
        />
      </FadeIn>

      <FadeIn delay={120} style={styles.footer}>
        <Button label="Continue" size="lg" onPress={() => goNext({ daysPerWeek: days })} />
        <Text style={styles.note}>You can adjust this anytime</Text>
      </FadeIn>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.md },
  title: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.title,
    color: colors.Ink,
    textAlign: 'center',
  },
  center: { flex: 1, justifyContent: 'center' },
  footer: { gap: spacing.sm },
  note: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
    textAlign: 'center',
  },
})
