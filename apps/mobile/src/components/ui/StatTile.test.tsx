import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react-native'
import { StatTile } from './StatTile'

let mockReduce = false
jest.mock('react-native-reanimated', () => ({
  ...(
    jest.requireActual('../../../jest.reanimated') as { reanimatedStub: () => object }
  ).reanimatedStub(),
  useReducedMotion: () => mockReduce,
}))

describe('StatTile countUp', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockReduce = false
  })
  afterEach(() => {
    jest.useRealTimers()
  })

  it('counts from 0 up to the value, and labels the final value throughout', async () => {
    await render(<StatTile kind="seed" label="Seeds" value={10} countUp />)
    expect(screen.getByLabelText('Seeds 10')).toBeTruthy()
    expect(screen.getByText('0')).toBeTruthy()
    await act(() => jest.advanceTimersByTime(2000))
    expect(screen.getByText('10')).toBeTruthy()
  })

  it('Reduce Motion shows the value at once', async () => {
    mockReduce = true
    await render(<StatTile kind="seed" label="Seeds" value={10} countUp />)
    expect(screen.getByText('10')).toBeTruthy()
  })

  it('without countUp the value is static', async () => {
    await render(<StatTile kind="streak" label="Streak" value={5} />)
    expect(screen.getByText('5')).toBeTruthy()
  })
})
