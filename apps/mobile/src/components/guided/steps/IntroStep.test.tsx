import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
import { IntroStep } from './IntroStep'
import type { CircleMember, CircleStudy, StudyDay } from '../../../types/db'

let mockDone: { user_id: string; day_number: number }[] = []
let mockStakes: string | null = null
jest.mock('../../../hooks/queries', () => ({
  useCircle: () => ({ id: 'c1', stakes_label: mockStakes }),
  useCompletions: () => ({ data: mockDone }),
}))
jest.mock('../../../hooks/use-auth-context', () => ({ useUserId: () => 'me' }))
jest.mock('../../ui/Chibi', () => ({
  Chibi: ({ message }: { message?: string }) => {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native')
    return <Text>{`chibi:${message}`}</Text>
  },
}))

const member = (id: string, name: string) =>
  ({ user_id: id, profile: { id, display_name: name, avatar_url: null } }) as CircleMember
const day = {
  day_number: 3,
  title: 'Trust in the dark',
  book_id: 'PRO',
  chapter: 3,
  verse_start: 5,
  verse_end: 6,
  read_minutes: 4,
} as StudyDay
const cs = { id: 'cs1', circle_id: 'c1' } as CircleStudy
const members = [member('me', 'Gabe Smith'), member('sam', 'Sam Lee')]
const show = (onReady = jest.fn()) =>
  render(<IntroStep day={day} circleStudy={cs} members={members} onReady={onReady} />)

describe('IntroStep', () => {
  beforeEach(() => {
    mockDone = [{ user_id: 'me', day_number: 2 }]
    mockStakes = null
  })

  it('renders greeting, day, passage, minutes and seeds, and unlocks Continue', async () => {
    const onReady = jest.fn()
    await show(onReady)
    expect(screen.getByText('chibi:Hi Gabe, ready for today?')).toBeTruthy()
    expect(screen.getByText('Trust in the dark')).toBeTruthy()
    expect(screen.getByText('Proverbs 3:5–6')).toBeTruthy()
    expect(screen.getByText('4 min read')).toBeTruthy()
    expect(screen.getByText('10 seeds for finishing today')).toBeTruthy()
    expect(screen.queryByText(/already finished/)).toBeNull()
    expect(screen.queryByText(/stakes/)).toBeNull()
    expect(onReady).toHaveBeenCalledWith(true)
  })

  it('lists circle members who finished today and shows the stakes line when set', async () => {
    mockDone = [
      { user_id: 'me', day_number: 2 },
      { user_id: 'sam', day_number: 3 },
    ]
    mockStakes = 'Coffee for the group'
    await show()
    expect(screen.getByText('Sam already finished today')).toBeTruthy()
    expect(screen.getByText("This week's stakes: Coffee for the group")).toBeTruthy()
  })

  it('uses the welcome-back copy after a slipped day', async () => {
    mockDone = []
    await show()
    expect(screen.getByText(/Welcome back, Gabe/)).toBeTruthy()
  })
})
