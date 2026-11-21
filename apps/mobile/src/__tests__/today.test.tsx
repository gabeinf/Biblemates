// Screen test for the Today (home) tab. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import Home from '../app/(main)/(tabs)/home'

const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: mockNavigate, push: jest.fn() }) }))
jest.mock('../hooks/use-auth-context', () => ({
  useAuthContext: () => ({ profile: { display_name: 'Me Self', avatar_url: null } }),
  useUserId: () => 'u1',
}))

const mockQuery = <T,>(data: T) => ({ data, isPending: false, isRefetching: false, isSuccess: true, refetch: jest.fn() })
let mockCompleted: string[] = []
jest.mock('../hooks/queries', () => ({
  useCircle: () => ({ id: 'c1', name: 'Grace Group', invite_code: 'ABC123' }),
  useMembers: () =>
    mockQuery([
      { user_id: 'u1', profile: { display_name: 'Me Self' } },
      { user_id: 'u2', profile: { display_name: 'Ann Lee' } },
    ]),
  useActivity: () => mockQuery([]),
  useCircleStudy: () =>
    mockQuery({
      id: 'cs1',
      started_on: require('../lib/study-day').todayIso(),
      study: {
        total_days: 7,
        days: Array.from({ length: 7 }, (_, i) => ({
          day_number: i + 1,
          title: 'God so loved',
          book_id: 'JHN',
          chapter: 3,
          verse_start: 1,
          verse_end: 21,
          read_minutes: 5,
          question: 'What stands out?',
        })),
      },
    }),
  useCompletions: () =>
    mockQuery(mockCompleted.map((u) => ({ user_id: u, day_number: 1, completed_at: new Date().toISOString() }))),
  usePrayerRequests: () => mockQuery([]),
  useDayReflections: () => mockQuery([]),
  useEncourage: () => ({ mutate: jest.fn(), isSuccess: false }),
  useMarkPrayerAnswered: () => ({ mutate: jest.fn() }),
}))

describe('Today', () => {
  beforeEach(() => {
    mockCompleted = []
    mockNavigate.mockClear()
  })

  it('shows the pasture, friends pill, reading card and a working CTA', async () => {
    await render(<Home />)
    expect(screen.getByLabelText('Your flock, 2 lambs')).toBeTruthy()
    expect(screen.getByLabelText('0/2 friends')).toBeTruthy()
    expect(screen.queryByLabelText(/day streak/)).toBeNull()
    expect(screen.getByText('Today')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue reading' }))
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/bible' }))
  })

  it('celebrates when the whole flock has read, and shows my streak', async () => {
    mockCompleted = ['u1', 'u2']
    await render(<Home />)
    expect(screen.getByText('Your whole flock read today.')).toBeTruthy()
    expect(screen.getByLabelText('1 day streak')).toBeTruthy()
    expect(screen.getByLabelText('2/2 friends')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Continue reading' })).toBeNull()
  })
})
