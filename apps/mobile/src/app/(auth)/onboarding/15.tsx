/**
 * 15 · Invite your circle. Opens the OS share sheet on enter, then shows the code.
 * The circle needs an account, so the code is provisional and local; the circle is created
 * later and this code is not yet claimable. See docs/specs/onboarding.md → "15 · Invite your circle".
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Share, StyleSheet, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Button, Card } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { StepHeading, StepScreen } from '../../../components/onboarding-step'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { getDraft, updateDraft } from '../../../lib/onboarding-draft'
import { colors, spacing, typography } from '../../../theme/tokens'

// No 0/O/1/I, so a code read aloud or off a screen survives.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Six characters from the readable alphabet. `random` is injectable for tests. */
export function makeCode(random: () => number = Math.random): string {
  return Array.from({ length: 6 }, () => ALPHABET[Math.floor(random() * ALPHABET.length)]).join('')
}

// One code per app session, so coming back to this step shows the code already shared.
let sessionCode: string | null = null
const getCode = () => (sessionCode ??= makeCode())

/** Test-only: forget the session's code. */
export function resetCodeForTests() {
  sessionCode = null
}

export default function InviteCircle() {
  const { goNext } = useOnboardingNav()
  const [code] = useState(getCode)
  const [copied, setCopied] = useState(false)
  const opened = useRef(false)

  const share = useCallback(async () => {
    try {
      const result = await Share.share({
        message: `Read the Bible with me on Biblemates. Join my circle: biblemates://join/${code} (code ${code})`,
      })
      if (result.action === Share.sharedAction) updateDraft({ invitedAt: new Date().toISOString() })
    } catch {
      // Sharing is never a gate: no share sheet (web, a refusal) just leaves the code on screen.
    }
  }, [code])

  // Auto-open once per visit; coming back after sharing shows the code without re-opening.
  useEffect(() => {
    if (opened.current || getDraft().invitedAt) return
    opened.current = true
    share()
  }, [share])

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <StepScreen footer={<Button label="Continue" size="lg" onPress={() => goNext()} />}>
      <FadeIn>
        <StepHeading
          title="Biblemates is better together"
          subtitle="Invite your circle now."
          align="center"
        />
      </FadeIn>
      <FadeIn delay={120} style={styles.body}>
        <Card style={styles.card}>
          <Text style={styles.label}>Your invite code</Text>
          <Text style={styles.code} accessibilityLabel={`Invite code ${code.split('').join(' ')}`}>
            {code}
          </Text>
        </Card>
        <Button label="Share invite" variant="outline" size="lg" onPress={share} />
        <Button
          label={copied ? 'Copied' : 'Copy code'}
          variant="outline"
          size="lg"
          onPress={copy}
        />
        <View accessibilityLiveRegion="polite">
          {copied ? <Text style={styles.confirm}>Code copied to your clipboard.</Text> : null}
        </View>
      </FadeIn>
    </StepScreen>
  )
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm },
  card: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  label: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.muted,
  },
  code: {
    fontFamily: typography.fontFamily.display,
    fontSize: typography.fontSize.display,
    letterSpacing: spacing.xs,
    color: colors.Ink,
  },
  confirm: {
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.caption,
    color: colors.success,
    textAlign: 'center',
  },
})
