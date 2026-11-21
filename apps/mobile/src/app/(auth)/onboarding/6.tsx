/**
 * 06 · Rhythm explainer. Introduces the shared weekly reading goal.
 * See docs/specs/onboarding.md → "06 · Rhythm explainer".
 */
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { StepHeading, StepScreen } from '../../../components/onboarding-step'
import { WeekGrid, type WeekRow } from '../../../components/onboarding-week'
import { useOnboardingNav } from '../../../hooks/use-onboarding'

const o = true
const _ = false
/** An example week, Monday first. Illustrative only: nothing here is the user's data. */
const EXAMPLE_WEEK: readonly WeekRow[] = [
  { label: 'You', days: [_, o, _, o, _, o, _] },
  { label: 'Your circle', days: [o, o, _, o, _, _, o] },
]

export default function RhythmExplainer() {
  const { goNext } = useOnboardingNav()

  return (
    <StepScreen mascot footer={<Button label="Continue" size="lg" onPress={() => goNext()} />}>
      <FadeIn>
        <StepHeading
          title="Pick a weekly rhythm together"
          subtitle="Choose how many days a week you’ll read."
        />
      </FadeIn>
      <FadeIn delay={120}>
        <WeekGrid
          rows={EXAMPLE_WEEK}
          footnote="Progress updates as soon as you mark a day’s reading done."
        />
      </FadeIn>
    </StepScreen>
  )
}
