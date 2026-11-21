import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { ThemeProvider, makeTheme, palettes, useTheme } from '../../theme'
import {
  CelebrationScaffold,
  ChunkyButton,
  LambView,
  PastureView,
  Pill,
  ProgressBar,
  StreakWeek,
} from '.'

describe('ui kit', () => {
  it('ChunkyButton fires onPress, and not when disabled or loading', async () => {
    const onPress = jest.fn()
    const { rerender } = await render(<ChunkyButton label="Check in" onPress={onPress} />)
    await fireEvent.press(screen.getByRole('button', { name: 'Check in' }))
    expect(onPress).toHaveBeenCalledTimes(1)

    await rerender(<ChunkyButton label="Check in" onPress={onPress} disabled />)
    await fireEvent.press(screen.getByRole('button', { name: 'Check in' }))
    await rerender(<ChunkyButton label="Check in" onPress={onPress} loading />)
    await fireEvent.press(screen.getByRole('button', { name: 'Check in' }))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('Pill and StreakWeek expose spoken labels', async () => {
    await render(
      <>
        <Pill kind="streak" value={5} />
        <StreakWeek days={['done', 'done', 'today', 'future', 'future', 'future', 'future']} />
      </>,
    )
    expect(screen.getByLabelText('5 day streak')).toBeTruthy()
    expect(screen.getByLabelText('2 of 7 days done this week')).toBeTruthy()
  })

  it('ProgressBar clamps its value', async () => {
    await render(<ProgressBar value={1.7} label="Reading" />)
    expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(100)
  })

  it('PastureView announces the flock size', async () => {
    await render(<PastureView lambCount={5} />)
    expect(screen.getByLabelText('Your flock, 5 lambs')).toBeTruthy()
    await render(<LambView view="front" />)
    expect(screen.getAllByLabelText('A lamb').length).toBe(1)
  })

  it('CelebrationScaffold shows copy, tiles and a working CTA', async () => {
    const onPress = jest.fn()
    await render(
      <CelebrationScaffold
        lamb={<LambView view="front" />}
        headline="Faithful today!"
        body="John 3:1–21"
        tiles={[{ kind: 'streak', label: 'Streak', value: 5 }]}
        primary={{ label: 'Continue', onPress }}
      />,
    )
    expect(screen.getByText('Faithful today!')).toBeTruthy()
    expect(screen.getByLabelText('Streak 5')).toBeTruthy()
    await fireEvent.press(screen.getByRole('button', { name: 'Continue' }))
    expect(onPress).toHaveBeenCalled()
  })

  it('ThemeProvider re-themes roles from another palette', async () => {
    const Probe = () => <Text testID="p">{useTheme().primary}</Text>
    await render(
      <ThemeProvider palette="testInverted">
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('p').props.children).toBe(makeTheme(palettes.testInverted).primary)
  })
})
