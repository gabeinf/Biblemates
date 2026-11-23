// Screen test for the Today (home) tab. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, within } from '@testing-library/react-native'
import Today from '../app/(main)/(tabs)/today'

const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: mockNavigate, push: jest.fn() }) }))
jest.mock('../hooks/use-auth-context', () => ({
  useAuthContext: () => ({ profile: { display_name: 'Me Self', avatar_url: null } }),
  useUserId: () => 'u1',
}))

const mockQuery = <T,>(data: T) => ({ data, isPending: false, isRefetching: false, isSuccess: true, refetch: jest.fn() })
let mockCompleted: string[] = []
let mockStartedDaysAgo = 0
let mockPrayers: unknown[] = []
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
      started_on: require('../lib/study-day').todayIso(new Date(Date.now() - mockStartedDaysAgo * 86_400_000)),
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
    mockQuery(mockCompleted.map((u) => ({ user_id: u, day_number: mockStartedDaysAgo + 1, completed_at: new Date().toISOString() }))),
  usePrayerRequests: () => mockQuery(mockPrayers),
  useDayReflections: () => mockQuery([]),
  useEncourage: () => ({
    mutate: (_vars: unknown, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.(),
    isSuccess: false,
  }),
  useMarkPrayerAnswered: () => ({ mutate: jest.fn() }),
}))

describe('Today', () => {
  beforeEach(() => {
    mockCompleted = []
    mockStartedDaysAgo = 0
    mockPrayers = []
    mockNavigate.mockClear()
  })

  it('shows the pasture, friends pill, reading card and a working CTA', async () => {
    await render(<Today />)
    expect(screen.getByLabelText('Your flock, 2 lambs')).toBeTruthy()
    expect(screen.getByLabelText('0/2 friends')).toBeTruthy()
    expect(screen.queryByLabelText(/day streak/)).toBeNull()
    expect(screen.getByText('Today')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue reading' }))
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/bible' }))
  })

  it('celebrates when the whole flock has read, and shows my streak', async () => {
    mockCompleted = ['u1', 'u2']
    await render(<Today />)
    expect(screen.getByText('Your whole flock read today.')).toBeTruthy()
    expect(screen.getByLabelText('1 day streak')).toBeTruthy()
    expect(screen.getByLabelText('2/2 friends')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Continue reading' })).toBeNull()
  })

  it('greets kindly and offers "Read now" when yesterday slipped by', async () => {
    mockStartedDaysAgo = 2
    await render(<Today />)
    expect(within(screen.getByTestId('slipped-banner')).getByText('Welcome back')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Read now' }))
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/bible' }))
  })

  it('shows no kind banner on the first day', async () => {
    await render(<Today />)
    expect(screen.queryByTestId('slipped-banner')).toBeNull()
  })

  it('hides the kind banner once today is read', async () => {
    mockStartedDaysAgo = 2
    mockCompleted = ['u1']
    await render(<Today />)
    expect(screen.queryByTestId('slipped-banner')).toBeNull()
  })

  it('shows the Hooray sheet with the friend\'s first name after a nudge', async () => {
    await render(<Today />)
    await fireEvent.press(screen.getByText('🙏 Pray for Ann'))
    expect(screen.getByText("Ann will know you're praying for them.")).toBeTruthy()
  })

  it('shows one lamb in the empty prayer list, and none once a request exists', async () => {
    await render(<Today />)
    const empty = within(screen.getByTestId('prayer-empty'))
    expect(empty.getAllByLabelText('A lamb')).toHaveLength(1)
    expect(empty.getByText('No open requests')).toBeTruthy()
  })

  it('hides the prayer lamb when there are open requests', async () => {
    mockPrayers = [{ id: 'p1', user_id: 'u2', body: 'Pray for my exam', created_at: new Date().toISOString(), encouragements: [] }]
    await render(<Today />)
    expect(screen.getByText('Pray for my exam')).toBeTruthy()
    expect(screen.queryByTestId('prayer-empty')).toBeNull()
  })
})
