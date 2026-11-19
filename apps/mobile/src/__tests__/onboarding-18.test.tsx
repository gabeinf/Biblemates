// Screen test for 18 · Referral source. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import type { OnboardingDraft } from '@biblemates/shared'
import ReferralSource, {
  OTHER_MAX,
  orderOptions,
  resetOrderForTests,
} from '../app/(auth)/onboarding/18'
import { clearDraft, updateDraft } from '../lib/onboarding-draft'

const mockGoNext = jest.fn<(answers?: Partial<OnboardingDraft>) => void>()
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 18, goNext: mockGoNext, goBack: jest.fn() }),
}))

const continueButton = () => screen.getByRole('button', { name: 'Continue' })
const labels = () => screen.getAllByRole('radio').map((r) => r.props.accessibilityLabel as string)

describe('18 · Referral source', () => {
  beforeEach(() => {
    clearDraft()
    resetOrderForTests()
    mockGoNext.mockClear()
  })

  it('pins "Other" last whatever the shuffle does', () => {
    for (const r of [() => 0, () => 0.5, () => 0.999]) {
      const order = orderOptions(r)
      expect(order).toHaveLength(6)
      expect(order.at(-1)?.id).toBe('other')
      expect(new Set(order.map((o) => o.id)).size).toBe(6)
    }
    // Different random draws give a different order, so it really is shuffled.
    expect(orderOptions(() => 0).map((o) => o.id)).not.toEqual(
      orderOptions(() => 0.999).map((o) => o.id),
    )
  })

  it('keeps the same order within a session', async () => {
    // Two mounts of the screen in one session: the second reads the order the first made.
    // (Not unmount-and-remount: FadeIn's pending timers would fire against the dead tree.)
    await render(
      <>
        <ReferralSource />
        <ReferralSource />
      </>,
    )
    const [a, b] = [labels().slice(0, 6), labels().slice(6)]
    expect(a.at(-1)).toBe('Other')
    expect(b).toEqual(a)
  })

  it('keeps Continue disabled until a row is chosen', async () => {
    await render(<ReferralSource />)
    expect(continueButton()).toBeDisabled()
    await fireEvent.press(continueButton())
    expect(mockGoNext).not.toHaveBeenCalled()
  })

  it('selects one row at a time and saves its id as source', async () => {
    await render(<ReferralSource />)
    await fireEvent.press(screen.getByRole('radio', { name: 'Instagram' }))
    await fireEvent.press(screen.getByRole('radio', { name: 'TikTok' }))
    expect(screen.getAllByRole('radio', { selected: true })).toHaveLength(1)
    expect(screen.getByRole('radio', { name: 'TikTok', selected: true })).toBeTruthy()
    await fireEvent.press(continueButton())
    expect(mockGoNext).toHaveBeenCalledWith({ source: { id: 'tiktok' } })
  })

  it('reveals the optional text field only for "Other", capped at 60 characters', async () => {
    await render(<ReferralSource />)
    expect(screen.queryByLabelText('Tell us more (optional)')).toBeNull()
    await fireEvent.press(screen.getByRole('radio', { name: 'Other' }))
    const field = screen.getByLabelText('Tell us more (optional)')
    expect(field.props.maxLength).toBe(OTHER_MAX)
    // Optional: Continue works with it empty.
    expect(continueButton()).toBeEnabled()
    await fireEvent.press(screen.getByRole('radio', { name: 'Friend or family' }))
    expect(screen.queryByLabelText('Tell us more (optional)')).toBeNull()
  })

  it('saves the trimmed free text with "Other", and omits it when blank', async () => {
    await render(<ReferralSource />)
    await fireEvent.press(screen.getByRole('radio', { name: 'Other' }))
    await fireEvent.changeText(screen.getByLabelText('Tell us more (optional)'), '  A podcast ')
    await fireEvent.press(continueButton())
    expect(mockGoNext).toHaveBeenLastCalledWith({ source: { id: 'other', other: 'A podcast' } })

    await fireEvent.changeText(screen.getByLabelText('Tell us more (optional)'), '   ')
    await fireEvent.press(continueButton())
    expect(mockGoNext).toHaveBeenLastCalledWith({ source: { id: 'other' } })
  })

  it('does not send stale free text after switching away from "Other"', async () => {
    await render(<ReferralSource />)
    await fireEvent.press(screen.getByRole('radio', { name: 'Other' }))
    await fireEvent.changeText(screen.getByLabelText('Tell us more (optional)'), 'A podcast')
    await fireEvent.press(screen.getByRole('radio', { name: 'TikTok' }))
    await fireEvent.press(continueButton())
    expect(mockGoNext).toHaveBeenCalledWith({ source: { id: 'tiktok' } })
  })

  it('restores an earlier answer when coming back', async () => {
    updateDraft({ source: { id: 'other', other: 'A podcast' } })
    await render(<ReferralSource />)
    expect(screen.getByRole('radio', { name: 'Other', selected: true })).toBeTruthy()
    expect(screen.getByLabelText('Tell us more (optional)').props.value).toBe('A podcast')
    expect(continueButton()).toBeEnabled()
  })

  it('ignores a saved source that is no longer an option', async () => {
    updateDraft({ source: { id: 'retired' } })
    await render(<ReferralSource />)
    expect(screen.queryAllByRole('radio', { selected: true })).toHaveLength(0)
    expect(continueButton()).toBeDisabled()
  })
})
