// Screen test for the success moments. Lives outside app/ so expo-router doesn't treat it as a route.
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import Celebrate from '../app/(main)/celebrate'
import { NudgeSheet } from '../components/NudgeSheet'

const mockDismissTo = jest.fn()
const mockHaptic = { tap: jest.fn(), success: jest.fn() }
let mockReduce = false
jest.mock('../components/ui/haptics', () => ({
  haptic: { tap: () => mockHaptic.tap(), success: () => mockHaptic.success() },
}))
jest.mock('react-native-reanimated', () => ({
  ...require('../../jest.reanimated').reanimatedStub(),
  useReducedMotion: () => mockReduce,
}))
let mockKind = 'checkin'
jest.mock('expo-router', () => ({
  useRouter: () => ({ dismissTo: mockDismissTo }),
  useLocalSearchParams: () => ({ kind: mockKind }),
}))
// RN's Modal mock renders nothing when hidden; keep the content so the slide-out is observable.
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const { View } = require('react-native')
  return {
    __esModule: true,
    default: ({ children }: { children: unknown }) => <View>{children as never}</View>,
  }
})
jest.mock('../hooks/use-auth-context', () => ({ useUserId: () => 'u1' }))

let mockSeeds = 10
const mockQuery = <T,>(data: T) => ({ data, isPending: false })
jest.mock('../hooks/queries', () => ({
  useCircle: () => ({ id: 'c1', name: 'Grace Group' }),
  useMembers: () => mockQuery([{ user_id: 'u1' }, { user_id: 'u2' }]),
  useCircleStudy: () =>
    mockQuery({
      started_on: require('../lib/study-day').todayIso(),
      study: {
        title: 'Faith Over Fear',
        total_days: 7,
        days: [
          {
            day_number: 1,
            title: 'T',
            book_id: 'JHN',
            chapter: 3,
            verse_start: 1,
            verse_end: 21,
            read_minutes: 5,
            question: 'q',
          },
        ],
      },
    }),
  useSeedsEarnedToday: () => mockQuery(mockSeeds),
  useCompletions: () =>
    mockQuery([{ user_id: 'u1', day_number: 1, completed_at: new Date().toISOString() }]),
}))

describe('Celebrate', () => {
  beforeEach(() => {
    mockDismissTo.mockClear()
    mockHaptic.tap.mockClear()
    mockHaptic.success.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
    mockReduce = false
  })

  it('check-in phase 1: congrats with real tiles, one success haptic, no seeds yet', async () => {
    mockKind = 'checkin'
    await render(<Celebrate />)
    expect(screen.getByText('Faithful today!')).toBeTruthy()
    expect(screen.getByText('Day 1 of 7')).toBeTruthy()
    expect(screen.getByLabelText('Streak 1')).toBeTruthy()
    expect(screen.getByLabelText('Friends read 1/2')).toBeTruthy()
    expect(screen.queryByLabelText(/^Seeds/)).toBeNull()
    await act(async () => void (await new Promise((r) => setTimeout(r, 200))))
    expect(mockHaptic.success).toHaveBeenCalledTimes(1)
    expect(mockDismissTo).not.toHaveBeenCalled()
  })

  it('check-in: Continue goes to seeds, which tick while counting, succeed at the end, then Pasture', async () => {
    jest.useFakeTimers()
    mockKind = 'checkin'
    await render(<Celebrate />)
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(screen.queryByText('Faithful today!')).toBeNull()
    expect(screen.getByText('Seeds earned')).toBeTruthy()
    expect(screen.getByText('+0')).toBeTruthy()
    mockHaptic.success.mockClear()
    await act(async () => void jest.advanceTimersByTime(2000))
    expect(screen.getByText('+10')).toBeTruthy()
    expect(mockHaptic.tap).toHaveBeenCalledTimes(9)
    expect(mockHaptic.success).toHaveBeenCalledTimes(1)
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(mockDismissTo).toHaveBeenCalledWith('/pasture')
  })

  it('check-in, Reduce Motion: final count at once and one haptic', async () => {
    jest.useFakeTimers()
    mockKind = 'checkin'
    mockReduce = true
    await render(<Celebrate />)
    await act(async () => void jest.advanceTimersByTime(1000))
    mockHaptic.success.mockClear()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    await act(async () => void jest.advanceTimersByTime(2000))
    expect(screen.getByText('+10')).toBeTruthy()
    expect(mockHaptic.tap).not.toHaveBeenCalled()
    expect(mockHaptic.success).toHaveBeenCalledTimes(1)
  })

  it('check-in with nothing earned: Continue skips seeds and goes to Pasture', async () => {
    mockKind = 'checkin'
    mockSeeds = 0
    await render(<Celebrate />)
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(mockDismissTo).toHaveBeenCalledWith('/pasture')
    mockSeeds = 10
  })

  it('study complete: celebrates the circle and the study title', async () => {
    mockKind = 'study'
    await render(<Celebrate />)
    expect(screen.getByText('Study complete!')).toBeTruthy()
    expect(screen.getByText('Faith Over Fear, together.')).toBeTruthy()
    expect(screen.queryByLabelText(/^Streak/)).toBeNull()
    expect(screen.queryByLabelText(/^Seeds/)).toBeNull()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(mockDismissTo).toHaveBeenCalledWith('/pasture')
  })
})

describe('NudgeSheet', () => {
  it('names who was prayed for and closes with Done', async () => {
    const onClose = jest.fn()
    await render(<NudgeSheet name="Ann" onClose={onClose} />)
    expect(screen.getByText("Ann will know you're praying for them.")).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('keeps the name while the sheet slides out after name goes null', async () => {
    const { rerender } = await render(<NudgeSheet name="Ann" onClose={jest.fn()} />)
    await rerender(<NudgeSheet name={null} onClose={jest.fn()} />)
    expect(screen.getByText("Ann will know you're praying for them.")).toBeTruthy()
    expect(screen.queryByText(/^They will know/)).toBeNull()
  })
})
