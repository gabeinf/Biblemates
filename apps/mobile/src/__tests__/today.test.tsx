// Screen test for the Today (home) tab. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen, within } from '@testing-library/react-native'
import Today from '../app/(main)/(tabs)/today'

const mockNavigate = jest.fn()
const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, push: mockPush }),
  useFocusEffect: (cb: () => void) => require('react').useEffect(cb, [cb]),
}))
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) },
})
jest.mock('../hooks/use-auth-context', () => ({
  useAuthContext: () => ({ profile: { display_name: 'Me Self', avatar_url: null } }),
  useUserId: () => 'u1',
}))

const mockQuery = <T,>(data: T) => ({ data, isPending: false, isRefetching: false, isSuccess: true, refetch: jest.fn() })
let mockCompleted: string[] = []
let mockStartedDaysAgo = 0
let mockPrayers: unknown[] = []
let mockNoStudy = false
let mockCompletionsLoading = false
let mockCircle: Record<string, unknown> = {}
let mockSeeds: number | undefined
jest.mock('../hooks/queries', () => ({
  useCircle: () => ({ id: 'c1', name: 'Grace Group', invite_code: 'ABC123', ...mockCircle }),
  useSeedBalance: () => mockQuery(mockSeeds),
  useMembers: () =>
    mockQuery([
      { user_id: 'u1', profile: { display_name: 'Me Self' } },
      { user_id: 'u2', profile: { display_name: 'Ann Lee' } },
    ]),
  useActivity: () => mockQuery([]),
  useCircleStudy: () =>
    mockQuery(mockNoStudy ? null : {
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
    mockQuery(mockCompletionsLoading ? undefined : mockCompleted.map((u) => ({ user_id: u, day_number: mockStartedDaysAgo + 1, completed_at: new Date().toISOString() }))),
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
    mockNoStudy = false
    mockCircle = {}
    mockCompletionsLoading = false
    mockSeeds = undefined
    jest.useRealTimers()
    store.clear()
    mockNavigate.mockClear()
    mockPush.mockClear()
  })

  it('shows the slim top bar (no pasture), friends pill and the hero with a working Start', async () => {
    await render(<Today />)
    expect(screen.queryByLabelText(/Your flock/)).toBeNull()
    expect(screen.getByLabelText('Profile')).toBeTruthy()
    expect(screen.getByLabelText('Scripture chat')).toBeTruthy()
    expect(screen.getByLabelText('0/2 friends')).toBeTruthy()
    expect(screen.queryByLabelText(/day streak/)).toBeNull()
    expect(screen.getByText('Today')).toBeTruthy()
    expect(screen.getByText('God so loved')).toBeTruthy()
    expect(screen.getByText('John 3:1–21 · 5 min read')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: "Start today's reading" }))
    expect(mockPush).toHaveBeenCalledWith('/guided')
    expect(screen.queryByRole('button', { name: /Continue reading|Read now/ })).toBeNull()
  })

  it('offers Continue with the persisted step, and goes to /guided', async () => {
    store.set('guided:cs1:1', '2')
    await render(<Today />)
    await fireEvent.press(screen.getByRole('button', { name: 'Continue, step 3 of 4' }))
    expect(mockPush).toHaveBeenCalledWith('/guided')
  })

  it('says it is waiting on a partner once I am done', async () => {
    mockCompleted = ['u1']
    await render(<Today />)
    expect(screen.getByText('Done! Waiting on Ann')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Start|Continue/ })).toBeNull()
    expect(screen.getByLabelText('1 day streak')).toBeTruthy()
  })

  it('celebrates when the whole flock has read', async () => {
    mockCompleted = ['u1', 'u2']
    await render(<Today />)
    expect(screen.getByText('Whole flock read today')).toBeTruthy()
    expect(screen.getByLabelText('2/2 friends')).toBeTruthy()
  })

  it('shows the empty state when there is no study', async () => {
    mockNoStudy = true
    await render(<Today />)
    expect(screen.getByText('No study yet')).toBeTruthy()
    expect(screen.queryByRole('button', { name: "Start today's reading" })).toBeNull()
  })

  it('keeps a secondary Open in Bible link', async () => {
    await render(<Today />)
    await fireEvent.press(screen.getByLabelText('Open in Bible'))
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/bible' }))
  })

  it('greets kindly when yesterday slipped by', async () => {
    mockStartedDaysAgo = 2
    await render(<Today />)
    expect(within(screen.getByTestId('slipped-banner')).getByText('Welcome back')).toBeTruthy()
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

  it('shows no lamb or chibi anywhere: hero, empty prayers, slipped banner, no study', async () => {
    mockStartedDaysAgo = 2
    const { unmount } = await render(<Today />)
    expect(screen.getByTestId('slipped-banner')).toBeTruthy()
    expect(within(screen.getByTestId('prayer-empty')).getByText('No open requests')).toBeTruthy()
    expect(screen.queryByLabelText('A lamb')).toBeNull()
    await unmount()
    mockNoStudy = true
    await render(<Today />)
    expect(screen.getByText('No study yet')).toBeTruthy()
    expect(screen.queryByLabelText('A lamb')).toBeNull()
  })

  it('hides the empty prayer state when there are open requests', async () => {
    mockPrayers = [{ id: 'p1', user_id: 'u2', body: 'Pray for my exam', created_at: new Date().toISOString(), encouragements: [] }]
    await render(<Today />)
    expect(screen.getByText('Pray for my exam')).toBeTruthy()
    expect(screen.queryByTestId('prayer-empty')).toBeNull()
  })

  it('shows the seeds balance pill once it has loaded', async () => {
    mockSeeds = 25
    await render(<Today />)
    expect(screen.getByLabelText('25 seeds')).toBeTruthy()
  })

  it('hides the seeds pill while the balance is loading', async () => {
    await render(<Today />)
    expect(screen.queryByLabelText(/ seeds$/)).toBeNull()
  })

  describe('accountability strip', () => {
    // Thursday 2026-11-26: a 5-day goal needs 3 done days by now (Mon–Wed).
    const thursday = new Date(2026, 10, 26, 9)
    const behindCircle = { goal_days_per_week: 5, stakes_label: 'Coffee on me' }
    const fakeDate = () =>
      jest.useFakeTimers({
        now: thursday,
        doNotFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate', 'nextTick', 'queueMicrotask', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
      })

    it('shows the week and the stakes line when behind pace', async () => {
      fakeDate()
      mockCircle = behindCircle
      await render(<Today />)
      const strip = within(screen.getByTestId('week-goal'))
      expect(strip.getByText('0 of 5 days')).toBeTruthy()
      expect(strip.getByLabelText('0 of 7 days done this week')).toBeTruthy()
      expect(strip.getByText('Miss your goal and you owe: Coffee on me')).toBeTruthy()
    })

    it('hides it when on pace', async () => {
      fakeDate()
      mockCompleted = ['u1']
      mockCircle = { goal_days_per_week: 1, stakes_label: 'Coffee on me' }
      await render(<Today />)
      expect(screen.queryByTestId('week-goal')).toBeNull()
    })

    it('hides it while completions are still loading', async () => {
      fakeDate()
      mockCircle = behindCircle
      mockCompletionsLoading = true
      await render(<Today />)
      expect(screen.queryByTestId('week-goal')).toBeNull()
    })

    it('hides it when the circle has no goal', async () => {
      fakeDate()
      await render(<Today />)
      expect(screen.queryByTestId('week-goal')).toBeNull()
    })

    it('leaves the stakes line out when no stakes were set', async () => {
      fakeDate()
      mockCircle = { goal_days_per_week: 5 }
      await render(<Today />)
      expect(screen.getByTestId('week-goal')).toBeTruthy()
      expect(screen.queryByText(/you owe/)).toBeNull()
    })
  })
})
