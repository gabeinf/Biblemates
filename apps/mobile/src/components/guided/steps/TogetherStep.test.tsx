import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { TogetherStep } from './TogetherStep'
import type { CircleMember, CircleStudy, Reflection, StudyDay } from '../../../types/db'

const mockEncourage = jest.fn((_v: unknown, opts?: { onSuccess?: () => void }) =>
  opts?.onSuccess?.(),
)
let mockDone: { user_id: string; day_number: number }[] = []
let mockReflections: Partial<Reflection>[] = []
jest.mock('../../../hooks/queries', () => ({
  useCircle: () => ({ id: 'c1', invite_code: 'ABC123' }),
  useCompletions: () => ({ data: mockDone }),
  useDayReflections: () => ({ data: mockReflections }),
  useEncourage: () => ({ mutate: mockEncourage, isPending: false, variables: undefined }),
}))
jest.mock('../../../hooks/use-auth-context', () => ({ useUserId: () => 'me' }))
jest.mock('../../ui/Chibi', () => ({
  Chibi: ({ mood, message }: { mood: string; message?: string }) => {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native')
    return <Text>{`chibi:${mood}${message ? `:${message}` : ''}`}</Text>
  },
}))
jest.mock('../../NudgeSheet', () => ({
  NudgeSheet: ({ name }: { name: string | null }) => {
    const { Text } = jest.requireActual<typeof import('react-native')>('react-native')
    return name ? <Text>{`nudged:${name}`}</Text> : null
  },
}))

const member = (id: string, name: string) =>
  ({ user_id: id, profile: { id, display_name: name, avatar_url: null } }) as CircleMember
const day = { day_number: 3 } as StudyDay
const cs = { id: 'cs1', circle_id: 'c1' } as CircleStudy
const ME = member('me', 'Me')
const SAM = member('sam', 'Sam Lee')
const AMY = member('amy', 'Amy')

const show = (members: CircleMember[]) =>
  render(<TogetherStep day={day} circleStudy={cs} members={members} onReady={jest.fn()} />)

describe('TogetherStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDone = []
    mockReflections = []
  })

  it('unlocks Continue straight away', async () => {
    const onReady = jest.fn()
    await render(<TogetherStep day={day} circleStudy={cs} members={[ME, SAM]} onReady={onReady} />)
    expect(onReady).toHaveBeenCalledWith(true)
  })

  it('solo circle shows the invite code and no nudges', async () => {
    await show([ME])
    expect(screen.getByText('ABC123')).toBeTruthy()
    expect(screen.getByText('chibi:idle')).toBeTruthy()
    expect(screen.queryByText(/Pray for/)).toBeNull()
  })

  it('shows only circle-visible partner answers, thinks while waiting, and nudges on tap', async () => {
    mockDone = [{ user_id: 'sam', day_number: 3 }]
    mockReflections = [
      { id: 'r1', user_id: 'sam', visibility: 'circle', body: 'Shared answer' },
      { id: 'r2', user_id: 'amy', visibility: 'private', body: 'Secret answer' },
      { id: 'r3', user_id: 'me', visibility: 'circle', body: 'My own answer' },
    ]
    await show([ME, SAM, AMY])
    expect(screen.getByText('Shared answer')).toBeTruthy()
    expect(screen.queryByText('Secret answer')).toBeNull()
    expect(screen.queryByText('My own answer')).toBeNull()
    expect(screen.getByText('chibi:think:Waiting on Amy')).toBeTruthy()
    expect(screen.queryByText('Pray for Sam')).toBeNull()

    await fireEvent.press(screen.getByRole('button', { name: 'Pray for Amy' }))
    expect(mockEncourage).toHaveBeenCalledWith(
      { circleId: 'c1', toUser: 'amy', kind: 'praying' },
      expect.anything(),
    )
    expect(screen.getByText('nudged:Amy')).toBeTruthy()
  })

  it('cheers once every partner is done', async () => {
    mockDone = [
      { user_id: 'sam', day_number: 3 },
      { user_id: 'amy', day_number: 3 },
    ]
    await show([ME, SAM, AMY])
    expect(screen.getByText('chibi:cheer')).toBeTruthy()
    expect(screen.queryByText(/Pray for/)).toBeNull()
  })
})
