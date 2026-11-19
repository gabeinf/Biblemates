import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text, TextInput } from 'react-native'
import { KeyboardScreen } from './KeyboardScreen'
import { Button } from './ui'

describe('KeyboardScreen', () => {
  it('renders the content and a tappable footer', async () => {
    const onPress = jest.fn()
    await render(
      <KeyboardScreen footer={<Button label="Continue" onPress={onPress} />}>
        <Text>What should your circle call you?</Text>
        <TextInput accessibilityLabel="Name" />
      </KeyboardScreen>,
    )
    expect(screen.getByText('What should your circle call you?')).toBeTruthy()
    expect(screen.getByLabelText('Name')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})
