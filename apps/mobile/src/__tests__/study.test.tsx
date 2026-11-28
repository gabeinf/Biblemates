// Screen test for the Study tab empty/completed states. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import Study from '../app/(main)/(tabs)/study'
import { todayIso } from '../lib/study-day'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: jest.fn(), push: mockPush }) }))
jest.mock('../hooks/use-auth-context', () => ({ useUserId: () => 'u1' }))

const mockQuery = <T,>(data: T) => ({ data, isPending: false, isError: false, isRefetching: false, refetch: jest.fn() })
let mockCircleStudy: unknown = null
jest.mock('../hooks/queries', () => ({
  useCircle: () => ({ id: 'c1' }),
  useMembers: () => mockQuery([{ user_id: 'u1', role: 'owner' }]),
  useCircleStudy: () => mockQuery(mockCircleStudy),
  useCompletions: () => mockQuery([]),
  useDayReflections: () => mockQuery([]),
  useStudies: () => mockQuery([{ id: 's1', title: 'Gospel of John', description: 'Seven days' }]),
  useReadingPosition: () => mockQuery({ book_id: 'PSA', chapter: 23 }),
  useStartStudy: () => ({ mutate: jest.fn(), isPending: false }),
}))

describe('Study empty states', () => {
  beforeEach(() => {
    mockCircleStudy = null
  })

  it('shows the lamb with "Choose a journey" when no study is chosen', async () => {
    await render(<Study />)
    expect(screen.getByLabelText('A lamb')).toBeTruthy()
    expect(screen.getByText('Choose a journey')).toBeTruthy()
    expect(screen.getByText('Gospel of John')).toBeTruthy()
  })

  it('shows the lamb when the study is completed', async () => {
    mockCircleStudy = { id: 'cs1', status: 'completed', study: { title: 'Gospel of John' } }
    await render(<Study />)
    expect(screen.getByLabelText('A lamb')).toBeTruthy()
    expect(screen.getByText('You finished Gospel of John!')).toBeTruthy()
  })

  it('has no lamb while a study is active', async () => {
    mockCircleStudy = {
      id: 'cs1',
      status: 'active',
      started_on: todayIso(),
      study: {
        title: 'Gospel of John',
        description: 'Seven days',
        total_days: 1,
        days: [{ day_number: 1, title: 'Day one', book_id: 'JHN', chapter: 3, verse_start: 1, verse_end: 21, read_minutes: 5, question: 'Q?' }],
      },
    }
    await render(<Study />)
    expect(screen.queryByLabelText('A lamb')).toBeNull()
    expect(screen.getByText('Continue study')).toBeTruthy()
  })
})

describe('Study segments', () => {
  beforeEach(() => {
    mockCircleStudy = null
    mockPush.mockClear()
  })

  it('opens on Plans and switches to Bible', async () => {
    await render(<Study />)
    expect(screen.getByText('Choose a journey')).toBeTruthy()
    await fireEvent.press(screen.getByText('Bible'))
    expect(screen.queryByText('Choose a journey')).toBeNull()
    expect(screen.getByText('Continue where you left off')).toBeTruthy()
    expect(screen.getByText('Psalms 23')).toBeTruthy()
    expect(screen.getByText('World English Bible')).toBeTruthy()
  })

  it.each(['Continue where you left off', 'Choose a book', 'Translation'])('"%s" pushes /bible', async (label) => {
    await render(<Study />)
    await fireEvent.press(screen.getByText('Bible'))
    await fireEvent.press(screen.getByText(label))
    expect(mockPush).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/bible' }))
  })
})
