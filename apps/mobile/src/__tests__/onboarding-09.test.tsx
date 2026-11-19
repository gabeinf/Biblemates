// Screen test for 09 · Payoff + fork. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import PayoffFork from '../app/(auth)/onboarding/9'

const mockGoNext = jest.fn<(answers?: object) => void>()
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 9, goNext: mockGoNext, goBack: jest.fn() }),
}))

describe('09 · Payoff + fork', () => {
  beforeEach(() => {
    mockGoNext.mockClear()
  })

  it('shows both panels full: every reader read every day', async () => {
    await render(<PayoffFork />)
    expect(screen.getAllByLabelText(/^Week \d: 21 of 21 readings done$/)).toHaveLength(2)
  })

  it('lists the outline button above the filled one', async () => {
    await render(<PayoffFork />)
    const labels = screen
      .getAllByText(/^(I have an invite code|Start a circle plan)$/)
      .map((n) => n.props.children)
    expect(labels).toEqual(['I have an invite code', 'Start a circle plan'])
  })

  it('records path join for the invite code button', async () => {
    await render(<PayoffFork />)
    await fireEvent.press(screen.getByRole('button', { name: 'I have an invite code' }))
    expect(mockGoNext).toHaveBeenCalledWith({ path: 'join' })
  })

  it('records path create and clears any saved code for the plan button', async () => {
    await render(<PayoffFork />)
    await fireEvent.press(screen.getByRole('button', { name: 'Start a circle plan' }))
    expect(mockGoNext).toHaveBeenCalledWith({ path: 'create', inviteCode: undefined })
  })
})
