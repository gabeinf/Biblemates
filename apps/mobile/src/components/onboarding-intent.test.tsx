// Screen test for 03 · Intent. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import Intent from '../app/(auth)/onboarding/3'
import { clearDraft, updateDraft } from '../lib/onboarding-draft'
import { INTENT_OPTIONS } from '../lib/onboarding-intent'

const mockGoNext = jest.fn()
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 3, goNext: mockGoNext, goBack: jest.fn() }),
}))

const [first, second] = INTENT_OPTIONS

describe('03 · Intent', () => {
  beforeEach(() => {
    mockGoNext.mockClear()
    clearDraft()
  })

  it('keeps Continue disabled until a row is chosen', async () => {
    await render(<Intent />)
    const cont = screen.getByRole('button', { name: 'Continue' })
    expect(cont.props.accessibilityState.disabled).toBe(true)
    await fireEvent.press(cont)
    expect(mockGoNext).not.toHaveBeenCalled()
  })

  it('selects exactly one row, moving the selection on tap', async () => {
    await render(<Intent />)
    await fireEvent.press(screen.getByRole('radio', { name: first.label }))
    expect(screen.getByRole('radio', { name: first.label, selected: true })).toBeTruthy()

    await fireEvent.press(screen.getByRole('radio', { name: second.label }))
    expect(screen.getByRole('radio', { name: second.label, selected: true })).toBeTruthy()
    expect(screen.getByRole('radio', { name: first.label, selected: false })).toBeTruthy()
    expect(screen.getAllByRole('radio', { selected: true })).toHaveLength(1)
  })

  it('saves the chosen option id as intent', async () => {
    await render(<Intent />)
    await fireEvent.press(screen.getByRole('radio', { name: second.label }))
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(mockGoNext).toHaveBeenCalledWith({ intent: second.id })
  })

  it('restores an earlier answer when coming back', async () => {
    updateDraft({ intent: second.id })
    await render(<Intent />)
    expect(screen.getByRole('radio', { name: second.label, selected: true })).toBeTruthy()
  })

  it('ignores a saved intent that is no longer an option', async () => {
    updateDraft({ intent: 'retired-option' })
    await render(<Intent />)
    expect(screen.queryAllByRole('radio', { selected: true })).toHaveLength(0)
  })
})
