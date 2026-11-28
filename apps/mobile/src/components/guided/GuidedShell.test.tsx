import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Alert } from 'react-native'
import { GuidedShell } from './GuidedShell'
import { loadGuidedStep } from '../../lib/guided-session'
import type { CircleStudy, StudyDay } from '../../types/db'

const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  },
})

const mockBack = jest.fn()
const mockMark = jest.fn((_day: number) => Promise.resolve())
const mockCelebrate = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }))
jest.mock('../../hooks/queries', () => ({
  useMarkDayComplete: () => ({ mutateAsync: mockMark, isPending: false }),
}))
jest.mock('../../lib/celebrations', () => ({
  showCelebration: (...a: unknown[]) => mockCelebrate(...a),
}))
jest.mock('@expo/vector-icons/Ionicons', () => ({ __esModule: true, default: () => null }))
jest.mock('../ui/LambView', () => ({ LambView: () => null }))
// ReflectStep has its own test; here it only needs to unlock Continue.
jest.mock('./steps/ReflectStep', () => {
  const { useEffect } = require('react')
  const { Text } = require('react-native')
  return {
    ReflectStep: ({ onReady }: { onReady: (r: boolean) => void }) => {
      useEffect(() => onReady(true), [onReady])
      return <Text>Reflect</Text>
    },
  }
})

const day = { day_number: 2 } as StudyDay
const cs = { id: 'cs1' } as CircleStudy

const continueBtn = (label = 'Continue') => screen.getByRole('button', { name: label })

describe('GuidedShell', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.localStorage?.clear()
  })

  it('walks every step, then marks the day complete and celebrates', async () => {
    await render(<GuidedShell day={day} circleStudy={cs} members={[]} />)
    for (const name of ['Intro', 'Read', 'Reflect']) {
      expect(screen.getByText(name)).toBeTruthy()
      await fireEvent.press(continueBtn())
    }
    expect(screen.getByText('Together')).toBeTruthy()
    expect(mockMark).not.toHaveBeenCalled()
    await fireEvent.press(continueBtn('Finish'))
    expect(mockMark).toHaveBeenCalledWith(2)
    expect(mockCelebrate).toHaveBeenCalledWith(expect.anything(), 'checkin')
    expect(loadGuidedStep('cs1', 2)).toBe(0)
  })

  it('saves the step and resumes from it', async () => {
    const first = await render(<GuidedShell day={day} circleStudy={cs} members={[]} />)
    await fireEvent.press(continueBtn())
    expect(loadGuidedStep('cs1', 2)).toBe(1)
    await first.unmount()
    await render(<GuidedShell day={day} circleStudy={cs} members={[]} />)
    expect(screen.getByText('Read')).toBeTruthy()
  })

  it('close asks first, and only Leave exits', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    await render(<GuidedShell day={day} circleStudy={cs} members={[]} />)
    await fireEvent.press(screen.getByLabelText('Close'))
    expect(mockBack).not.toHaveBeenCalled()
    const buttons = alert.mock.calls[0][2]!
    await act(async () => buttons.find((b) => b.text === 'Leave')!.onPress!())
    expect(mockBack).toHaveBeenCalledTimes(1)
  })
})
