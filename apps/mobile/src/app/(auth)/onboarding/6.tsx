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
  { label: 'You', days: [o, o, o, _, _, _, _] },
  { label: 'Your circle', days: [o, _, _, o, _, o, _] },
]

export default function RhythmExplainer() {
  const { goNext } = useOnboardingNav()

  return (
    <StepScreen footer={<Button label="Continue" size="lg" onPress={() => goNext()} />}>
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
