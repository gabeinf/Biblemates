// Screen test for 12 · Stakes picker. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import type { OnboardingDraft } from '@biblemates/shared'
import StakesPicker from '../app/(auth)/onboarding/12'
import { clearDraft, getDraft, updateDraft } from '../lib/onboarding-draft'

const mockGoNext = jest.fn<(answers?: Partial<OnboardingDraft>) => void>()
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 12, goNext: mockGoNext, goBack: jest.fn() }),
}))

const continueButton = () => screen.getByRole('button', { name: 'Continue' })

describe('12 · Stakes picker', () => {
  beforeEach(() => {
    clearDraft()
    mockGoNext.mockClear()
  })

  it('keeps Continue disabled until a stakes is chosen', async () => {
    await render(<StakesPicker />)
    expect(continueButton()).toBeDisabled()

    await fireEvent.press(screen.getByRole('button', { name: 'Coffee on me' }))
    expect(screen.getByRole('button', { name: 'Coffee on me' })).toBeSelected()
    expect(getDraft().stakes).toEqual({ kind: 'preset', label: 'Coffee on me' })

    await fireEvent.press(continueButton())
    expect(mockGoNext).toHaveBeenCalledWith({ stakes: { kind: 'preset', label: 'Coffee on me' } })
  })

  it('moves the selection when another tile is tapped', async () => {
    await render(<StakesPicker />)
    await fireEvent.press(screen.getByRole('button', { name: 'Coffee on me' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Handwritten note' }))
    expect(screen.getByRole('button', { name: 'Coffee on me' })).not.toBeSelected()
    expect(screen.getByRole('button', { name: 'Handwritten note' })).toBeSelected()
  })

  it('adds a custom stakes that shows as the selected tile', async () => {
    await render(<StakesPicker />)
    await fireEvent.press(screen.getByRole('button', { name: 'Make your own stakes' }))
    // Saving an empty label explains why instead of doing nothing.
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Write what you’ll owe.')).toBeTruthy()

    await fireEvent.changeText(screen.getByLabelText('Your stakes'), '  Bake cookies ')
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByRole('button', { name: 'Bake cookies' })).toBeSelected()
    expect(getDraft().stakes).toEqual({ kind: 'custom', label: 'Bake cookies' })
  })

  it('rejects labels over 40 characters', async () => {
    await render(<StakesPicker />)
    await fireEvent.press(screen.getByRole('button', { name: 'Make your own stakes' }))
    await fireEvent.changeText(screen.getByLabelText('Your stakes'), 'x'.repeat(41))
    expect(screen.getByText('Keep it to 40 characters.')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }))
    expect(getDraft().stakes).toBeUndefined()
  })

  it('edits the selected tile with its pencil', async () => {
    await render(<StakesPicker />)
    await fireEvent.press(screen.getByRole('button', { name: 'I cook dinner' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Edit “I cook dinner”' }))
    await fireEvent.changeText(screen.getByLabelText('Your stakes'), 'I cook dinner twice')
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }))
    expect(getDraft().stakes).toEqual({ kind: 'custom', label: 'I cook dinner twice' })
  })

  it('starts with the saved answer selected', async () => {
    updateDraft({ stakes: { kind: 'custom', label: 'Bake cookies' } })
    await render(<StakesPicker />)
    expect(screen.getByRole('button', { name: 'Bake cookies' })).toBeSelected()
    expect(continueButton()).toBeEnabled()
  })

  it('keeps the selection when the editor is cancelled', async () => {
    await render(<StakesPicker />)
    await fireEvent.press(screen.getByRole('button', { name: 'Coffee on me' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Make your own stakes' }))
    await fireEvent.changeText(screen.getByLabelText('Your stakes'), 'Something else')
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('button', { name: 'Coffee on me' })).toBeSelected()
    expect(getDraft().stakes).toEqual({ kind: 'preset', label: 'Coffee on me' })
  })

  it('keeps a custom value around after picking a preset', async () => {
    await render(<StakesPicker />)
    await fireEvent.press(screen.getByRole('button', { name: 'Make your own stakes' }))
    await fireEvent.changeText(screen.getByLabelText('Your stakes'), 'Bake cookies')
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Handwritten note' }))
    expect(screen.getByRole('button', { name: 'Bake cookies' })).not.toBeSelected()
    await fireEvent.press(screen.getByRole('button', { name: 'Bake cookies' }))
    expect(getDraft().stakes).toEqual({ kind: 'custom', label: 'Bake cookies' })
  })

  it('closes the editor when a tile is picked instead', async () => {
    await render(<StakesPicker />)
    await fireEvent.press(screen.getByRole('button', { name: 'Make your own stakes' }))
    await fireEvent.press(screen.getByRole('button', { name: 'Coffee on me' }))
    expect(screen.queryByLabelText('Your stakes')).toBeNull()
    expect(continueButton()).toBeEnabled()
  })
})
