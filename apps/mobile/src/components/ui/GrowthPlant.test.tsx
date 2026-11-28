import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
import { GROWTH_SPECIES, GrowthPlant, type GrowthStage } from './GrowthPlant'

let mockReduce = false
const mockSpring = jest.fn((v: unknown) => v)
jest.mock('react-native-reanimated', () => ({
  ...(
    jest.requireActual('../../../jest.reanimated') as { reanimatedStub: () => object }
  ).reanimatedStub(),
  useReducedMotion: () => mockReduce,
  withSpring: (v: unknown) => mockSpring(v),
}))

const stages: GrowthStage[] = [0, 1, 2, 3, 'withered', 'empty']

describe('GrowthPlant', () => {
  beforeEach(() => {
    mockReduce = false
    mockSpring.mockClear()
  })

  it.each(Object.keys(GROWTH_SPECIES))('renders every stage of %s', async (species) => {
    for (const stage of stages) {
      const { unmount } = await render(
        <GrowthPlant species={species as keyof typeof GROWTH_SPECIES} stage={stage} />,
      )
      expect(screen.getByRole('image')).toBeTruthy()
      await unmount()
    }
  })

  it('springs on mount and on stage change', async () => {
    const { rerender } = await render(<GrowthPlant species="rose" stage={1} />)
    expect(mockSpring).toHaveBeenCalledTimes(1)
    await rerender(<GrowthPlant species="rose" stage={2} />)
    expect(mockSpring).toHaveBeenCalledTimes(2)
  })

  it('skips the spring under reduced motion', async () => {
    mockReduce = true
    const { rerender } = await render(<GrowthPlant species="rose" stage={1} />)
    await rerender(<GrowthPlant species="rose" stage={2} />)
    expect(mockSpring).not.toHaveBeenCalled()
  })
})
