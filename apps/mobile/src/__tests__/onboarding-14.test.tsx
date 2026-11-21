// Screen test for 14 · Commitment. Lives outside app/ so expo-router doesn't treat it as a route.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import type { OnboardingDraft } from '@biblemates/shared'
import Commitment from '../app/(auth)/onboarding/14'
import { COMMIT_SUCCESS_MS, type Stroke } from '../lib/signature'

const mockGoNext = jest.fn<(answers?: Partial<OnboardingDraft>) => void>()
jest.mock('../hooks/use-onboarding', () => ({
  useOnboardingNav: () => ({ step: 14, goNext: mockGoNext, goBack: jest.fn() }),
}))

const mockHaptic = jest.fn<() => Promise<void>>().mockResolvedValue()
jest.mock('expo-haptics', () => ({
  notificationAsync: () => mockHaptic(),
  NotificationFeedbackType: { Success: 'success' },
}))

// Reanimated needs a native worklets runtime. The overlay only uses Animated.View and
// entering builders, so plain Views and chainable no-op builders are enough here.
jest.mock('react-native-reanimated', () => {
  const builder: Record<string, unknown> = {}
  for (const k of ['duration', 'springify', 'damping']) builder[k] = () => builder
  return { ...require('../../jest.reanimated').reanimatedStub(), FadeIn: builder, ZoomIn: builder }
})

// Stand in for the pad: a button that "draws" a long or short stroke.
jest.mock('../components/SignaturePad', () => {
  const { Pressable, Text } = jest.requireActual<typeof import('react-native')>('react-native')
  return {
    SignaturePad: ({ onChange }: { onChange: (s: readonly Stroke[]) => void }) => (
      <>
        <Pressable
          onPress={() =>
            onChange([
              [
                { x: 0, y: 0 },
                { x: 200, y: 0 },
              ],
            ])
          }
        >
          <Text>draw long</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            onChange([
              [
                { x: 0, y: 0 },
                { x: 4, y: 0 },
              ],
            ])
          }
        >
          <Text>draw dot</Text>
        </Pressable>
      </>
    ),
  }
})

const imIn = () => screen.getByRole('button', { name: 'I’m in →' })

describe('14 · Commitment', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockGoNext.mockClear()
    mockHaptic.mockClear()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('unlocks only after a stroke of meaningful length', async () => {
    await render(<Commitment />)
    expect(imIn()).toBeDisabled()
    await fireEvent.press(screen.getByText('draw dot'))
    expect(imIn()).toBeDisabled()
    await fireEvent.press(screen.getByText('draw long'))
    expect(imIn()).toBeEnabled()
  })

  it('Clear empties the pad and disables the button again', async () => {
    await render(<Commitment />)
    await fireEvent.press(screen.getByText('draw long'))
    await fireEvent.press(screen.getByRole('button', { name: 'Clear signature' }))
    expect(imIn()).toBeDisabled()
  })

  it('shows the success badge, then saves only committedAt and moves on', async () => {
    await render(<Commitment />)
    await fireEvent.press(screen.getByText('draw long'))
    await fireEvent.press(imIn())
    expect(screen.getByLabelText('Committed')).toBeTruthy()
    expect(mockHaptic).toHaveBeenCalledTimes(1)
    expect(mockGoNext).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(COMMIT_SUCCESS_MS)
    })
    expect(mockGoNext).toHaveBeenCalledTimes(1)
    const answers = mockGoNext.mock.calls[0][0] ?? {}
    expect(Object.keys(answers)).toEqual(['committedAt'])
    expect(Number.isNaN(Date.parse(answers.committedAt ?? ''))).toBe(false)
  })
})
