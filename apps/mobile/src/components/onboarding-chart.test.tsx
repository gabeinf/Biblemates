import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { ChartCard } from './onboarding-chart'

let mockReduceMotion = false
jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => mockReduceMotion }))

const WIDTH = 300
const series = [
  { label: 'Together', values: [0.5, 0.9], color: '#000', emphasis: true },
  { label: 'Alone', values: [0.5, 0.1], color: '#666' },
]

async function renderChart() {
  await render(
    <ChartCard
      title="Chart"
      description="Together stays high, alone drops"
      series={series}
      startLabel="Start"
      endLabel="End"
    />,
  )
  await fireEvent(screen.getByTestId('chart-plot'), 'layout', {
    nativeEvent: { layout: { width: WIDTH, height: 180 } },
  })
}

const style = (id: string) =>
  screen.getAllByTestId(id).map((el) => StyleSheet.flatten(el.props.style))

describe('ChartCard', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('draws the whole chart at once under Reduce Motion', async () => {
    mockReduceMotion = true
    await renderChart()
    expect(style('chart-reveal')[0].width).toBeGreaterThan(WIDTH)
    expect(style('chart-end').map((s) => s.opacity)).toEqual([1, 1])
  })

  it('starts with nothing drawn and reveals the curves over time', async () => {
    mockReduceMotion = false
    await renderChart()
    expect(style('chart-reveal')[0].width).toBe(0)
    expect(style('chart-end').map((s) => s.opacity)).toEqual([0, 0])
  })

  it('reads as one image with a description for screen readers', async () => {
    mockReduceMotion = false
    await renderChart()
    expect(screen.getByRole('image', { name: 'Together stays high, alone drops' })).toBeTruthy()
  })
})
