/**
 * 07 · Stakes teaser. Introduces friendly weekly stakes with a card that cycles through
 * the same presets 12 offers. See docs/specs/onboarding.md → "07 · Stakes teaser".
 */
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { StakesCarousel } from '../../../components/onboarding-stakes'
import { StepHeading, StepScreen } from '../../../components/onboarding-step'
import { useOnboardingNav } from '../../../hooks/use-onboarding'
import { STAKES_PRESETS } from '../../../lib/stakes'

export default function StakesTeaser() {
  const { goNext } = useOnboardingNav()

  return (
    <StepScreen mascot footer={<Button label="Continue" size="lg" onPress={() => goNext()} />}>
      <FadeIn>
        <StakesCarousel presets={STAKES_PRESETS} />
      </FadeIn>
      <FadeIn delay={120}>
        <StepHeading
          title="Add a little friendly stakes"
          subtitle="Something small keeps everyone showing up."
          align="center"
        />
      </FadeIn>
    </StepScreen>
  )
}
