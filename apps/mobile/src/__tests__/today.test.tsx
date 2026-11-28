// Screen test for the Today (home) tab. Lives outside app/ so expo-router doesn't treat it as a route.
import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { ScrollView } from 'react-native'
import { fireEvent, render, screen } from '@testing-library/react-native'
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
        title: 'Journey',
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

  it('shows the slim top bar and the study line, with no friends pill or Today title', async () => {
    await render(<Today />)
    expect(screen.getByLabelText('Profile')).toBeTruthy()
    expect(screen.getByLabelText('Scripture chat')).toBeTruthy()
    expect(screen.getByText('Journey, Day 1 of 7')).toBeTruthy()
    expect(screen.queryByLabelText(/friends/)).toBeNull()
    expect(screen.queryByLabelText(/day streak/)).toBeNull()
    expect(screen.queryByLabelText(/Your flock/)).toBeNull()
  })

  it('draws one node per day and starts the guided session from today’s node', async () => {
    await render(<Today />)
    expect(screen.getByLabelText('Day 1, today')).toBeTruthy()
    expect(screen.getByLabelText('Day 2, locked')).toBeTruthy()
    expect(screen.getByText('Start')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Day 1, today' }))
    expect(mockPush).toHaveBeenCalledWith('/guided')
  })

  it('shows the in-progress bubble with the persisted step', async () => {
    store.set('guided:cs1:1', '2')
    await render(<Today />)
    expect(screen.getByText('Continue, step 3 of 4')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Day 1, today' }))
    expect(mockPush).toHaveBeenCalledWith('/guided')
  })

  it('marks earlier unread days as missed, kindly', async () => {
    mockStartedDaysAgo = 2
    await render(<Today />)
    expect(screen.getByLabelText('Day 1, missed')).toBeTruthy()
    expect(screen.getByLabelText('Day 2, missed')).toBeTruthy()
    expect(screen.getByLabelText('Day 3, today')).toBeTruthy()
    expect(screen.queryByTestId('slipped-banner')).toBeNull()
  })

  it('captions the node when I am done and a partner is still reading', async () => {
    mockCompleted = ['u1']
    await render(<Today />)
    expect(screen.getByText('Done, waiting on Ann')).toBeTruthy()
    expect(screen.getByLabelText('Day 1, done')).toBeTruthy()
    expect(screen.queryByText('Start')).toBeNull()
    expect(screen.getByLabelText('1 day streak')).toBeTruthy()
  })

  it('captions the whole flock and sits the partner on the node', async () => {
    mockCompleted = ['u1', 'u2']
    await render(<Today />)
    expect(screen.getByText('Whole flock read today')).toBeTruthy()
    expect(screen.getByLabelText('Ann Lee finished')).toBeTruthy()
  })

  it('shows the empty state when there is no study', async () => {
    mockNoStudy = true
    await render(<Today />)
    expect(screen.getByText('No study yet')).toBeTruthy()
    expect(screen.queryByTestId('learning-path')).toBeNull()
    expect(screen.queryByLabelText('A lamb')).toBeNull()
  })

  it('keeps a small Open in Bible link under the path', async () => {
    await render(<Today />)
    await fireEvent.press(screen.getByLabelText('Open in Bible'))
    expect(mockNavigate).toHaveBeenCalledWith(expect.objectContaining({ pathname: '/bible' }))
  })

  it('drops the feed, group question, encourage chips, circle card, banners and prayer list', async () => {
    mockStartedDaysAgo = 2
    mockPrayers = [{ id: 'p1', user_id: 'u2', body: 'Pray for my exam', created_at: new Date().toISOString(), encouragements: [] }]
    await render(<Today />)
    for (const gone of [/Your circle today/, /group question/i, /Pray for/, /Encourage someone/, /Grace Group/, /Welcome back/, /Prayer requests/, /Pray for my exam/, /No open requests/, /Start today/]) {
      expect(screen.queryByText(gone)).toBeNull()
    }
    expect(screen.queryByTestId('prayer-empty')).toBeNull()
  })

  it('shows no lamb or chibi, with or without a study', async () => {
    const { unmount } = await render(<Today />)
    expect(screen.queryByLabelText('A lamb')).toBeNull()
    expect(screen.queryByLabelText(/chibi/i)).toBeNull()
    await unmount()
    mockNoStudy = true
    await render(<Today />)
    expect(screen.queryByLabelText('A lamb')).toBeNull()
  })

  it('scrolls once so today’s node is centred', async () => {
    mockStartedDaysAgo = 4
    const scrollTo = jest.spyOn(ScrollView.prototype, 'scrollTo').mockImplementation(() => undefined)
    await render(<Today />)
    await fireEvent(screen.getByTestId('today-scroll'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 800 } } })
    await fireEvent(screen.getByTestId('learning-path').parent!, 'layout', { nativeEvent: { layout: { x: 0, y: 100, width: 390, height: 900 } } })
    await fireEvent(screen.getByTestId('path-day-5'), 'layout', { nativeEvent: { layout: { x: 0, y: 700, width: 100, height: 100 } } })
    expect(scrollTo).toHaveBeenCalledTimes(1)
    // path top 100 + node centre 750 - half the 800 viewport
    expect(scrollTo).toHaveBeenCalledWith({ y: 450, animated: false })
    scrollTo.mockRestore()
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

    it('shows the stakes line when behind pace', async () => {
      fakeDate()
      mockCircle = behindCircle
      await render(<Today />)
      expect(screen.getByTestId('week-goal')).toHaveTextContent('Miss your goal and you owe: Coffee on me')
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

    it('shows no stakes line when none were set', async () => {
      fakeDate()
      mockCircle = { goal_days_per_week: 5 }
      await render(<Today />)
      expect(screen.queryByTestId('week-goal')).toBeNull()
      expect(screen.queryByText(/you owe/)).toBeNull()
    })
  })
})
