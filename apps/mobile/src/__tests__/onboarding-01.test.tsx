// Screen test for 01 · Intro. Lives outside app/ so expo-router doesn't treat it as a route.
import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import Intro from '../app/(auth)/onboarding/1'

const mockReplace = jest.fn()
let mockReady = true
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }))
jest.mock('../lib/splash', () => ({ useAppReady: () => mockReady }))

describe('01 · Intro', () => {
  it('shows the first-lamb sheet and waits for Continue (no auto-advance)', async () => {
    mockReady = true
    await render(<Intro />)
    expect(screen.getByText('Meet your first lamb')).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(mockReplace).toHaveBeenCalledWith('/onboarding/2')
  })

  it('renders nothing but the brand backdrop while the app is still loading', async () => {
    mockReady = false
    await render(<Intro />)
    expect(screen.queryByText('Meet your first lamb')).toBeNull()
  })
})
