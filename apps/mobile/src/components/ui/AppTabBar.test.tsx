import type { ComponentProps } from 'react'
import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { setTabBarHidden } from '../../lib/tab-bar'
import { AppTabBar } from './AppTabBar'

const NAMES = ['pasture', 'today', 'study']
function setup(index = 1, todayProgress?: number) {
  const navigate = jest.fn()
  const props = {
    state: { index, routes: NAMES.map((name) => ({ key: `${name}-k`, name })) },
    emitter: { emit: () => ({ defaultPrevented: false }) },
    navigateToTab: navigate,
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    todayProgress,
  }
  return { navigate, ui: <AppTabBar {...(props as unknown as ComponentProps<typeof AppTabBar>)} /> }
}

describe('AppTabBar', () => {
  afterEach(() => setTabBarHidden(false))

  it('renders the three labelled tabs in order, with the current one selected', async () => {
    await render(setup(1).ui)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.props.accessibilityLabel)).toEqual(['Pasture', 'Today', 'Study'])
    expect(tabs.map((t) => t.props.accessibilityState.selected)).toEqual([false, true, false])
  })

  it('navigates on press, and does nothing for the selected tab', async () => {
    const { navigate, ui } = setup(1)
    await render(ui)
    await fireEvent.press(screen.getByLabelText('Study'))
    expect(navigate).toHaveBeenCalledWith('study-k')
    await fireEvent.press(screen.getByLabelText('Today'))
    expect(navigate).toHaveBeenCalledTimes(1)
  })

  it('renders nothing while hidden', async () => {
    setTabBarHidden(true)
    await render(setup().ui)
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
  })

  it('the Today ring reports progress in quarters', async () => {
    await render(setup(1, 0.5).ui)
    expect(screen.getByTestId('today-ring').props.accessibilityValue.now).toBe(2)
  })
})
