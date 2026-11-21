import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { StepScreen } from './onboarding-step'

describe('StepScreen', () => {
  it('shows the front lamb only when the step asks for a mascot', async () => {
    const { rerender } = await render(
      <StepScreen footer={<Text>cta</Text>}>
        <Text>body</Text>
      </StepScreen>,
    )
    expect(screen.queryByLabelText('A lamb')).toBeNull()
    await rerender(
      <StepScreen mascot footer={<Text>cta</Text>}>
        <Text>body</Text>
      </StepScreen>,
    )
    expect(screen.getByLabelText('A lamb')).toBeTruthy()
    expect(screen.getByText('body')).toBeTruthy()
  })
})
