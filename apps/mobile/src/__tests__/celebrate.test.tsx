// Screen test for the success moments. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import Celebrate from '../app/(main)/celebrate'
import { NudgeSheet } from '../components/NudgeSheet'

const mockDismissTo = jest.fn()
let mockKind = 'checkin'
jest.mock('expo-router', () => ({
  useRouter: () => ({ dismissTo: mockDismissTo }),
  useLocalSearchParams: () => ({ kind: mockKind }),
}))
jest.mock('../hooks/use-auth-context', () => ({ useUserId: () => 'u1' }))

const mockQuery = <T,>(data: T) => ({ data, isPending: false })
jest.mock('../hooks/queries', () => ({
  useCircle: () => ({ id: 'c1', name: 'Grace Group' }),
  useMembers: () =>
    mockQuery([{ user_id: 'u1' }, { user_id: 'u2' }]),
  useCircleStudy: () =>
    mockQuery({
      started_on: require('../lib/study-day').todayIso(),
      study: {
        title: 'Faith Over Fear',
        total_days: 7,
        days: [
          { day_number: 1, title: 'T', book_id: 'JHN', chapter: 3, verse_start: 1, verse_end: 21, read_minutes: 5, question: 'q' },
        ],
      },
    }),
  useCompletions: () => mockQuery([{ user_id: 'u1', day_number: 1, completed_at: new Date().toISOString() }]),
}))

describe('Celebrate', () => {
  beforeEach(() => {
    mockDismissTo.mockClear()
  })

  it('check-in: gold headline, passage, real streak and friends tiles, Continue goes home', async () => {
    mockKind = 'checkin'
    await render(<Celebrate />)
    expect(screen.getByText('Faithful today!')).toBeTruthy()
    expect(screen.getByText('Day 1 of 7')).toBeTruthy()
    expect(screen.getByLabelText('Streak 1')).toBeTruthy()
    expect(screen.getByLabelText('Friends read 1/2')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(mockDismissTo).toHaveBeenCalledWith('/home')
  })

  it('study complete: celebrates the circle and the study title', async () => {
    mockKind = 'study'
    await render(<Celebrate />)
    expect(screen.getByText('Study complete!')).toBeTruthy()
    expect(screen.getByText('Faith Over Fear, together.')).toBeTruthy()
    expect(screen.queryByLabelText(/^Streak/)).toBeNull()
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
})
