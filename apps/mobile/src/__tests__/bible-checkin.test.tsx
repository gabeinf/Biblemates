// Screen test: marking today's reading done opens the check-in celebration. Lives outside app/ so expo-router doesn't treat it as a route.
import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import Bible from '../app/(main)/(tabs)/bible'

const mockPush = jest.fn()
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: jest.fn() }),
  useLocalSearchParams: () => ({ book: 'JHN', chapter: '3' }),
  useFocusEffect: jest.fn(),
}))
jest.mock('../hooks/use-auth-context', () => ({ useUserId: () => 'u1' }))
jest.mock('../services/annotations', () => ({ saveReadingPosition: jest.fn() }))
jest.mock('../components/bible/VerseActionSheet', () => ({ __esModule: true, default: () => null }))
jest.mock('../components/bible/BookPicker', () => ({ __esModule: true, default: () => null }))
jest.mock('../lib/tab-bar', () => ({ setTabBarHidden: jest.fn() }))

const q = <T,>(data: T) => ({ data, isPending: false, isError: false })
jest.mock('../hooks/queries', () => ({
  useBookmarks: () => q([]),
  useChapter: () => q({ translation: 'web', verses: [{ verse: 1, text: 'For God so loved the world', bookId: 'JHN', chapter: 3 }] }),
  useChapterReflections: () => q([]),
  useCircle: () => ({ id: 'c1' }),
  useCircleStudy: () =>
    q({
      id: 'cs1',
      started_on: require('../lib/study-day').todayIso(),
      study: {
        total_days: 7,
        days: [{ day_number: 1, title: 'T', book_id: 'JHN', chapter: 3, verse_start: 1, verse_end: 21, read_minutes: 5, question: 'q' }],
      },
    }),
  useCompletions: () => q([]),
  useHighlights: () => q([]),
  useMarkDayComplete: () => ({ mutate: (_day: number, opts?: { onSuccess?: () => void }) => opts?.onSuccess?.() }),
  useReadingPosition: () => ({ data: undefined, isPending: true }),
  useSetHighlight: () => ({ mutate: jest.fn() }),
  useToggleBookmark: () => ({ mutate: jest.fn() }),
}))

describe('Bible check-in', () => {
  it('opens the check-in celebration after Mark Day 1 as read', async () => {
    await render(<Bible />)
    await fireEvent.press(await screen.findByText('Mark Day 1 as read'))
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/celebrate', params: { kind: 'checkin' } })
  })
})
