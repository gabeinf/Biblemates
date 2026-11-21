// Screen test for circle setup. Lives outside app/ so expo-router doesn't treat it as a route.
import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import CircleSetup from '../app/(main)/circle-setup'

jest.mock('../hooks/use-auth-context', () => ({ useAuthContext: () => ({ profile: { display_name: 'Me Self' } }) }))
jest.mock('../hooks/queries', () => ({
  useCreateCircle: () => ({ mutate: jest.fn(), isPending: false }),
  useJoinCircle: () => ({ mutate: jest.fn(), isPending: false }),
}))

describe('Circle setup', () => {
  it('greets with the lamb on the choose step and drops it once a form opens', async () => {
    await render(<CircleSetup />)
    expect(screen.getByLabelText('A lamb')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Start a new circle' }))
    expect(screen.queryByLabelText('A lamb')).toBeNull()
  })
})
