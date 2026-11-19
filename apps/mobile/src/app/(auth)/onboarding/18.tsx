/**
 * 18 · Referral source. Attribution: how did they hear about us.
 * See docs/specs/onboarding.md → "18 · Referral source".
 */
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import type Ionicons from '@expo/vector-icons/Ionicons'
import { Button } from '../../../components/ui'
import { FadeIn, TextField } from '../../../components/onboarding'
import { ChoiceRow } from '../../../components/onboarding-choice'
import { StepHeading } from '../../../components/onboarding-step'
import { KeyboardScreen } from '../../../components/KeyboardScreen'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { getDraft } from '../../../lib/onboarding-draft'
import { spacing } from '../../../theme/tokens'

type Option = { id: string; label: string; icon: keyof typeof Ionicons.glyphMap }

// Generic icons only: we don't hold licences for the Instagram or TikTok marks.
const OPTIONS: readonly Option[] = [
  { id: 'church', label: 'Church or small group', icon: 'people-outline' },
  { id: 'friend', label: 'Friend or family', icon: 'chatbubbles-outline' },
  { id: 'instagram', label: 'Instagram', icon: 'camera-outline' },
  { id: 'tiktok', label: 'TikTok', icon: 'play-circle-outline' },
  { id: 'store', label: 'App Store search', icon: 'search-outline' },
]
const OTHER: Option = { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' }
export const OTHER_MAX = 60

/** Fisher–Yates over a copy, with "Other" always last. `random` is injectable for tests. */
export function orderOptions(random: () => number = Math.random): Option[] {
  const list = [...OPTIONS]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[list[i], list[j]] = [list[j], list[i]]
  }
  return [...list, OTHER]
}

// Shuffled once per app session, so the order doesn't reshuffle when coming back to this step.
let sessionOrder: Option[] | null = null
const getOrder = () => (sessionOrder ??= orderOptions())

/** Test-only: forget the session's order. */
export function resetOrderForTests() {
  sessionOrder = null
}

export default function ReferralSource() {
  const { goNext } = useOnboardingNav()
  const [order] = useState(getOrder)
  // Coming back from 19 keeps the earlier answer. A saved id that's no longer an option is ignored.
  const saved = getDraft().source
  const [id, setId] = useState<string | null>(() =>
    order.some((o) => o.id === saved?.id) ? saved!.id : null,
  )
  const [other, setOther] = useState(saved?.other ?? '')

  const onContinue = () => {
    if (!id) return
    const note = other.trim()
    goNext({ source: id === OTHER.id && note ? { id, other: note } : { id } })
  }

  return (
    <KeyboardScreen
      footer={<Button label="Continue" size="lg" disabled={id === null} onPress={onContinue} />}
    >
      <FadeIn>
        <StepHeading
          title="How did you find us?"
          subtitle="It helps us reach more people like you."
          align="center"
        />
      </FadeIn>

      <FadeIn delay={120} style={styles.options}>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {order.map((o) => (
            <ChoiceRow
              key={o.id}
              label={o.label}
              icon={o.icon}
              selected={id === o.id}
              onPress={() => setId(o.id)}
            />
          ))}
        </View>
        {id === OTHER.id ? (
          <TextField
            label="Tell us more (optional)"
            value={other}
            onChangeText={setOther}
            maxLength={OTHER_MAX}
            returnKeyType="done"
            onSubmitEditing={onContinue}
            hint={`${other.length}/${OTHER_MAX}`}
          />
        ) : null}
      </FadeIn>
    </KeyboardScreen>
  )
}

const styles = StyleSheet.create({
  options: { gap: spacing.sm },
})
