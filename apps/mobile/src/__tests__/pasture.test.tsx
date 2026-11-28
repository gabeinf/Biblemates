// Screen test for the Pasture tab. Lives outside app/ so expo-router doesn't treat it as a route.
import { describe, expect, it, jest } from '@jest/globals'
import { act, render, screen } from '@testing-library/react-native'
import Pasture from '../app/(main)/(tabs)/pasture'

const mockRefetchCircle = jest.fn(async () => {})
const mockRefetchMembers = jest.fn(async () => {})
jest.mock('../hooks/queries', () => ({
  useCircle: () => ({ id: 'c1', name: 'Grace Group' }),
  useMyCircle: () => ({ refetch: mockRefetchCircle }),
  useMembers: () => ({ data: [{ user_id: 'u1' }, { user_id: 'u2' }, { user_id: 'u3' }], refetch: mockRefetchMembers }),
}))

describe('Pasture tab', () => {
  it('shows the circle name and one lamb per member', async () => {
    await render(<Pasture />)
    expect(screen.getByText('Grace Group')).toBeTruthy()
    expect(screen.getByLabelText('Your flock, 3 lambs')).toBeTruthy()
  })

  it('pull-to-refresh refetches circle and members', async () => {
    await render(<Pasture />)
    const { refreshControl } = screen.getByTestId('pasture-scroll').props
    await act(() => refreshControl.props.onRefresh())
    expect(mockRefetchCircle).toHaveBeenCalledTimes(1)
    expect(mockRefetchMembers).toHaveBeenCalledTimes(1)
  })
})
