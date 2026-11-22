// Screen test for 01 · Intro. Lives outside app/ so expo-router doesn't treat it as a route.
import { describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react-native'
import { triggers } from '../../jest.rive'
import Intro from '../app/(auth)/onboarding/1'

const mockReplace = jest.fn()
let mockReady = true
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))
jest.mock('../lib/splash', () => ({ useAppReady: () => mockReady }))

describe('01 · Intro', () => {
  it('plays the Rive intro and waits for its Continue (no auto-advance)', async () => {
    mockReady = true
    await render(<Intro />)
    await screen.findByTestId('rive-view')
    expect(mockReplace).not.toHaveBeenCalled()
    await act(async () => triggers.continueTapped())
    expect(mockReplace).toHaveBeenCalledWith('/onboarding/2')
  })

  it('renders nothing but the brand backdrop while the app is still loading', async () => {
    mockReady = false
    await render(<Intro />)
    expect(screen.queryByTestId('intro-scene')).toBeNull()
  })
})
