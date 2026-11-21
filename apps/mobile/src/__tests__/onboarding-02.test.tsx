import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
import Hook from '../app/(auth)/onboarding/2'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/onboarding/2',
}))
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native')
  return { SafeAreaView: (p: object) => <View testID="safe-area" {...p} /> }
})

describe('02 · Hook', () => {
  it('takes top and bottom insets from the native SafeAreaView, not the JS hook', async () => {
    await render(<Hook />)
    expect(screen.getByTestId('safe-area').props.edges).toEqual(['top', 'bottom'])
    expect(screen.getByText('That’s us')).toBeTruthy()
  })
})
