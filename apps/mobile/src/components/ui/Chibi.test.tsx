import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react-native'
import { CHEER_MS, Chibi, READY_MS } from './Chibi'

const mockPet = jest.fn()
let mockReduce = false
jest.mock('react-native-reanimated', () => ({
  ...(
    jest.requireActual('../../../jest.reanimated') as { reanimatedStub: () => object }
  ).reanimatedStub(),
  useReducedMotion: () => mockReduce,
}))
jest.mock('./LambView', () => ({
  LambView: ({ petRef }: { petRef: { current: unknown } }) => {
    petRef.current = { pet: mockPet }
    return null
  },
}))

describe('Chibi', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockReduce = false
    mockPet.mockClear()
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('cheer hops, settles to waiting, fires onSettled once, then nudges after ~6s', async () => {
    const onSettled = jest.fn()
    await render(<Chibi mood="cheer" onSettled={onSettled} />)
    expect(mockPet).toHaveBeenCalledTimes(1)
    expect(onSettled).not.toHaveBeenCalled()
    await act(() => jest.advanceTimersByTime(CHEER_MS))
    expect(onSettled).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Ready when you are')).toBeNull()
    await act(() => jest.advanceTimersByTime(READY_MS))
    expect(screen.getByText('Ready when you are')).toBeTruthy()
    expect(onSettled).toHaveBeenCalledTimes(1)
  })

  it('shows an explicit message and no nudge outside waiting', async () => {
    await render(<Chibi mood="reading" message="Let’s read" />)
    await act(() => jest.advanceTimersByTime(READY_MS * 2))
    expect(screen.getByText('Let’s read')).toBeTruthy()
    expect(screen.queryByText('Ready when you are')).toBeNull()
  })

  it('reduced motion skips the hop but still settles', async () => {
    mockReduce = true
    const onSettled = jest.fn()
    await render(<Chibi mood="cheer" onSettled={onSettled} />)
    expect(mockPet).not.toHaveBeenCalled()
    await act(() => jest.advanceTimersByTime(CHEER_MS))
    expect(onSettled).toHaveBeenCalledTimes(1)
  })
})
