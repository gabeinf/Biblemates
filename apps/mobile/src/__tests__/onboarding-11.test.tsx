// Screen test for 11 · Stakes rules. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import StakesRules from '../app/(auth)/onboarding/11'

const mockGoNext = jest.fn<() => void>()
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 11, goNext: mockGoNext, goBack: jest.fn() }),
}))

describe('11 · Stakes rules', () => {
  beforeEach(() => mockGoNext.mockClear())

  it('shows the three outcomes in order', async () => {
    await render(<StakesRules />)
    const titles = screen
      .getAllByText(/^(Everyone reads|Someone falls short|Everyone misses)$/)
      .map((n) => n.props.children)
    expect(titles).toEqual(['Everyone reads', 'Someone falls short', 'Everyone misses'])
  })

  it('gives every card a labeled You and Circle badge', async () => {
    await render(<StakesRules />)
    const labels = screen
      .getAllByLabelText(/^(You|Circle): (hit|missed)$/)
      .map((n) => n.props.accessibilityLabel)
    expect(labels).toEqual([
      'You: hit',
      'Circle: hit',
      'You: missed',
      'Circle: hit',
      'You: missed',
      'Circle: missed',
    ])
  })

  it('has a button that is not "Continue" and goes to the next step', async () => {
    await render(<StakesRules />)
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull()
    await fireEvent.press(screen.getByRole('button', { name: 'Choose your stakes' }))
    expect(mockGoNext).toHaveBeenCalledTimes(1)
  })
})
