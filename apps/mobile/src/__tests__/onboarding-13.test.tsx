// Screen test for 13 · Name. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import type { OnboardingDraft } from '@biblemates/shared'
import Name from '../app/(auth)/onboarding/13'
import { clearDraft, getDraft, updateDraft } from '../lib/onboarding-draft'

const mockGoNext = jest.fn<(answers?: Partial<OnboardingDraft>) => void>()
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 13, goNext: mockGoNext, goBack: jest.fn() }),
}))

const field = () => screen.getByLabelText('Your name')
const continueButton = () => screen.getByRole('button', { name: 'Continue' })

describe('13 · Name', () => {
  beforeEach(() => {
    clearDraft()
    mockGoNext.mockClear()
  })

  it('sets up the field for a first name and opens the keyboard', async () => {
    await render(<Name />)
    expect(field().props.autoFocus).toBe(true)
    expect(field().props.autoCapitalize).toBe('words')
    expect(field().props.textContentType).toBe('givenName')
  })

  it('keeps Continue disabled while the trimmed name is empty', async () => {
    await render(<Name />)
    expect(continueButton()).toBeDisabled()
    await fireEvent.changeText(field(), '   ')
    expect(continueButton()).toBeDisabled()
    await fireEvent.changeText(field(), ' Grace ')
    expect(continueButton()).toBeEnabled()
  })

  it('saves the trimmed name and moves on from the button', async () => {
    await render(<Name />)
    await fireEvent.changeText(field(), ' Grace ')
    expect(getDraft().displayName).toBe('Grace')
    await fireEvent.press(continueButton())
    expect(mockGoNext).toHaveBeenCalledWith({ displayName: 'Grace' })
  })

  it('submits from the return key, but not when empty', async () => {
    await render(<Name />)
    await fireEvent(field(), 'submitEditing')
    expect(mockGoNext).not.toHaveBeenCalled()
    await fireEvent.changeText(field(), 'Sam')
    await fireEvent(field(), 'submitEditing')
    expect(mockGoNext).toHaveBeenCalledWith({ displayName: 'Sam' })
  })

  it('starts with the saved name, and clearing it clears the draft', async () => {
    updateDraft({ displayName: 'Ruth' })
    await render(<Name />)
    expect(field()).toHaveDisplayValue('Ruth')
    await fireEvent.changeText(field(), '')
    expect(getDraft().displayName).toBeUndefined()
  })

  it('keeps the gap and the button above the keyboard, not just the field', async () => {
    await render(<Name />)
    const scroll = () => screen.getByTestId('name-scroll')
    await fireEvent(screen.getByTestId('below-field'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 80 } },
    })
    // 80 (32 gap + 48 button) + 16 spacing
    expect(scroll().props.bottomOffset).toBe(96)
  })
})
