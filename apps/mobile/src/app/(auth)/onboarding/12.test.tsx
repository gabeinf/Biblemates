import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { resetDraftCacheForTests } from '../../../lib/onboarding-draft'
import StakesPicker from './12'

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/onboarding/12',
}))

beforeEach(() => resetDraftCacheForTests())

const tileStyle = (el: any) => {
  const s = el.props.style
  return StyleSheet.flatten(typeof s === 'function' ? s({ pressed: false }) : s)
}

describe('12 · Stakes picker', () => {
  it('keeps the tile box the same when selected (check is out of flow)', async () => {
    await render(<StakesPicker />)
    const tile = screen
      .getAllByRole('button')
      .find((b) => b.props.accessibilityState?.selected === false)!
    const before = tileStyle(tile)
    await fireEvent.press(tile)
    const after = tileStyle(
      screen.getAllByRole('button').find((b) => b.props.accessibilityState?.selected === true)!,
    )
    expect(after.borderWidth).toBe(before.borderWidth)
    expect(after.minHeight).toBe(before.minHeight)
    expect(after.padding).toBe(before.padding)
    const check = screen.getByTestId('stakes-check')
    expect(StyleSheet.flatten(check.props.style).position).toBe('absolute')
  })
})
