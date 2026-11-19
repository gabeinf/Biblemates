/**
 * 08 · Together preview. Shows what the app looks like when a circle is active.
 * See docs/specs/onboarding.md → "08 · Together preview".
 */
import { Button } from '../../../components/ui'
import { FadeIn } from '../../../components/onboarding'
import { StepHeading, StepScreen } from '../../../components/onboarding-step'
import {
  PreviewStack,
  ThisWeekCard,
  type SampleHighlight,
  type SampleMember,
} from '../../../components/onboarding-together'
import { useOnboardingNav } from '../../../hooks/use-onboarding'

/** Sample content only: made-up members, public-domain verse text (WEB). */
const HIGHLIGHTS: readonly SampleHighlight[] = [
  {
    name: 'Joy Kim',
    day: 'Mon',
    verse: 'Be still, and know that I am God.',
    reference: 'Psalm 46:10',
    color: 'sky',
  },
  {
    name: 'Ben Cole',
    day: 'Wed',
    verse: 'Let’s consider how to provoke one another to love and good works.',
    reference: 'Hebrews 10:24',
    color: 'sage',
  },
  {
    name: 'Ana Reyes',
    day: 'Today',
    verse: 'Two are better than one, because they have a good reward for their labor.',
    reference: 'Ecclesiastes 4:9',
    color: 'gold',
    reflection: 'Reading this with you two this week has kept me going.',
  },
]

const MEMBERS: readonly SampleMember[] = [
  { name: 'You', read: 3, goal: 3 },
  { name: 'Ana Reyes', read: 3, goal: 3 },
]

export default function TogetherPreview() {
  const { goNext } = useOnboardingNav()

  return (
    <StepScreen footer={<Button label="Continue" size="lg" onPress={() => goNext()} />}>
      <PreviewStack highlights={HIGHLIGHTS} />
      <FadeIn delay={240}>
        <ThisWeekCard members={MEMBERS} streakWeeks={3} />
      </FadeIn>
      <FadeIn delay={320}>
        <StepHeading
          title="Watch each other show up"
          subtitle="It’s easier to keep going when you’re not alone."
          align="center"
        />
      </FadeIn>
    </StepScreen>
  )
}
