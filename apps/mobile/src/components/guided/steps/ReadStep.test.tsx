import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { ReadStep } from './ReadStep'
import type { CircleStudy, StudyDay } from '../../../types/db'

const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({ useRouter: () => ({ navigate: mockNavigate }) }))
let mockChapter: { data?: unknown; isError?: boolean; isSuccess?: boolean } = {}
jest.mock('../../../hooks/queries', () => ({ useChapter: () => mockChapter }))
jest.mock('../../ui/Chibi', () => ({
  Chibi: ({ mood }: { mood: string }) => {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native')
    return <Text>{`chibi:${mood}`}</Text>
  },
}))

const verses = [1, 2, 3, 4].map((n) => ({ bookId: 'JHN', chapter: 3, verse: n, text: `Verse ${n} text.` }))
const day = {
  day_number: 1,
  book_id: 'JHN',
  chapter: 3,
  verse_start: 2,
  verse_end: 3,
  read_minutes: 2,
} as StudyDay
const cs = { id: 'cs1' } as CircleStudy
const onReady = jest.fn()
const show = () => render(<ReadStep day={day} circleStudy={cs} members={[]} onReady={onReady} />)
const measure = async (box: number, content: number) => {
  const sv = screen.getByTestId('passage')
  await fireEvent(sv, 'layout', { nativeEvent: { layout: { height: box } } })
  await fireEvent(sv, 'contentSizeChange', 300, content)
}

describe('ReadStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockChapter = { data: { verses }, isSuccess: true }
  })

  it('renders only the day’s verse range with the reading chibi', async () => {
    await show()
    expect(screen.getByText(/Verse 2 text\./)).toBeTruthy()
    expect(screen.getByText(/Verse 3 text\./)).toBeTruthy()
    expect(screen.queryByText(/Verse 1 text\./)).toBeNull()
    expect(screen.queryByText(/Verse 4 text\./)).toBeNull()
    expect(screen.getByText('John 3:2–3')).toBeTruthy()
    expect(screen.getByText('chibi:reading')).toBeTruthy()
  })

  it('is ready immediately when the passage fits', async () => {
    await show()
    await measure(400, 200)
    expect(onReady).toHaveBeenLastCalledWith(true)
  })

  it('waits for the end of a long passage, then unlocks', async () => {
    await show()
    await measure(300, 900)
    expect(onReady).toHaveBeenLastCalledWith(false)
    await fireEvent.scroll(screen.getByTestId('passage'), {
      nativeEvent: {
        contentOffset: { y: 100 },
        layoutMeasurement: { height: 300 },
        contentSize: { height: 900 },
      },
    })
    expect(onReady).toHaveBeenLastCalledWith(false)
    await fireEvent.scroll(screen.getByTestId('passage'), {
      nativeEvent: {
        contentOffset: { y: 600 },
        layoutMeasurement: { height: 300 },
        contentSize: { height: 900 },
      },
    })
    expect(onReady).toHaveBeenLastCalledWith(true)
  })

  it('does not strand the user when the chapter fails to load', async () => {
    mockChapter = { isError: true }
    await show()
    expect(onReady).toHaveBeenLastCalledWith(true)
  })

  it('keeps the Bible tab link', async () => {
    await show()
    await fireEvent.press(screen.getByRole('button', { name: 'Open in Bible tab' }))
    expect(mockNavigate).toHaveBeenCalledWith({
      pathname: '/bible',
      params: { book: 'JHN', chapter: '3', verse: '2' },
    })
  })
})
