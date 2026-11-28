import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { ReflectStep } from './ReflectStep'
import type { CircleStudy, StudyDay } from '../../../types/db'

type Opts = { onSuccess?: () => void }
const mockMutate = jest.fn((_v: unknown, o?: Opts) => o?.onSuccess?.())
jest.mock('../../../hooks/queries', () => ({
  useCircle: () => ({ id: 'c1', name: 'Grace Group' }),
  useCreateReflection: () => ({ mutate: mockMutate, isPending: false, error: null }),
}))
jest.mock('../../ui/SeedIcon', () => ({ SeedIcon: () => null }))

const day = { day_number: 3, question: 'What stood out?' } as StudyDay
const cs = { id: 'cs1' } as CircleStudy
const onReady = jest.fn()
const setup = () =>
  render(<ReflectStep day={day} circleStudy={cs} members={[]} onReady={onReady} />)

describe('ReflectStep', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('saves with the /reflect mode=day payload and unlocks Continue', async () => {
    await setup()
    expect(screen.getByText('What stood out?')).toBeTruthy()
    expect(onReady).not.toHaveBeenCalledWith(true)
    await fireEvent.changeText(screen.getByLabelText('Your answer'), 'Trust.')
    await fireEvent.press(screen.getByRole('button', { name: 'Share' }))
    expect(mockMutate.mock.calls[0][0]).toEqual({
      circleId: 'c1',
      body: 'Trust.',
      visibility: 'circle',
      circleStudyId: 'cs1',
      dayNumber: 3,
    })
    expect(onReady).toHaveBeenCalledWith(true)
  })

  it('skip unlocks Continue without saving', async () => {
    await setup()
    await fireEvent.press(screen.getByRole('button', { name: 'Skip, no bonus' }))
    expect(mockMutate).not.toHaveBeenCalled()
    expect(onReady).toHaveBeenCalledWith(true)
  })

  it('shows the seeds hint only when sharing to the circle', async () => {
    await setup()
    expect(screen.getByText('+5 seeds for sharing')).toBeTruthy()
    await fireEvent.press(screen.getByRole('radio', { name: 'Keep private' }))
    expect(screen.queryByText('+5 seeds for sharing')).toBeNull()
    await fireEvent.changeText(screen.getByLabelText('Your answer'), 'Mine.')
    await fireEvent.press(screen.getByRole('button', { name: 'Save note' }))
    expect(mockMutate.mock.calls[0][0]).toMatchObject({ visibility: 'private' })
  })
})
