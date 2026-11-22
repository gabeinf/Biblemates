import { describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { failure, triggers } from '../../../jest.rive'
import { ThemeProvider } from '../../theme'
import { IntroView } from './IntroView.native'

async function setup() {
  const fns = { onLanded: jest.fn(), onReady: jest.fn(), onContinue: jest.fn() }
  await render(
    <ThemeProvider>
      <IntroView {...fns} />
    </ThemeProvider>,
  )
  return fns
}

describe('native IntroView', () => {
  it('maps the Rive triggers onto landed, ready and continue (continue fires once)', async () => {
    const fns = await setup()
    await screen.findByTestId('intro-scene')
    await act(async () => triggers.landed())
    await act(async () => triggers.onboardingReady())
    expect(fns.onLanded).toHaveBeenCalledTimes(1)
    expect(fns.onReady).toHaveBeenCalledTimes(1)
    await act(async () => {
      triggers.continueTapped()
      triggers.continueTapped()
    })
    expect(fns.onContinue).toHaveBeenCalledTimes(1)
  })

  it('falls back to the static sheet with a working Continue when the Rive file fails to load', async () => {
    failure.error = new Error('bad riv')
    try {
      const fns = await setup()
      await fireEvent.press(await screen.findByRole('button', { name: 'Continue' }))
      expect(fns.onContinue).toHaveBeenCalledTimes(1)
      expect(screen.queryByTestId('rive-view')).toBeNull()
    } finally {
      failure.error = null
    }
  })

  it('exposes Continue to VoiceOver only once the sheet is ready', async () => {
    const fns = await setup()
    const scene = await screen.findByTestId('intro-scene')
    expect(scene.props.accessible).toBe(false)
    await act(async () => triggers.onboardingReady())
    expect(screen.getByTestId('intro-scene').props.accessible).toBe(true)
    await fireEvent(screen.getByTestId('intro-scene'), 'accessibilityTap')
    expect(fns.onContinue).toHaveBeenCalledTimes(1)
  })
})
