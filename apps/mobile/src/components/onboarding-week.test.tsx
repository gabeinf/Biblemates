import { describe, expect, it, jest } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
import { StyleSheet } from 'react-native'
import { WeekGrid, rowSummary } from './onboarding-week'

let mockReduceMotion = false
jest.mock('react-native-reanimated', () => ({ useReducedMotion: () => mockReduceMotion }))

const o = true
const _ = false
const rows = [
  { label: 'You', days: [o, o, _, _, _, _, _] },
  { label: 'Circle', days: [_, _, _, _, _, _, o] },
]
const NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const opacities = () =>
  screen
    .getAllByTestId('week-check', { includeHiddenElements: true })
    .map((el) => StyleSheet.flatten(el.props.style).opacity)

describe('WeekGrid', () => {
  it('shows 7 day columns and one labelled row per reader', async () => {
    mockReduceMotion = true
    await render(<WeekGrid rows={rows} footnote="note" />)
    expect(screen.getAllByText(/^[A-Z]$/, { includeHiddenElements: true })).toHaveLength(7)
    expect(screen.getByLabelText('You: read Monday and Tuesday')).toBeTruthy()
    expect(screen.getByLabelText('Circle: read Sunday')).toBeTruthy()
    expect(screen.getByText('note')).toBeTruthy()
  })

  it('shows every check at once under Reduce Motion', async () => {
    mockReduceMotion = true
    await render(<WeekGrid rows={rows} footnote="note" />)
    expect(opacities()).toEqual([1, 1, 1])
  })

  it('starts with the checks hidden so they can pop in', async () => {
    mockReduceMotion = false
    await render(<WeekGrid rows={rows} footnote="note" />)
    expect(opacities()).toEqual([0, 0, 0])
  })

  it('is not interactive', async () => {
    mockReduceMotion = true
    await render(<WeekGrid rows={rows} footnote="note" />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})

describe('rowSummary', () => {
  it('lists read days in order', () => {
    expect(rowSummary({ label: 'You', days: [o, _, o, _, _, _, o] }, NAMES)).toBe(
      'You: read Monday, Wednesday and Sunday',
    )
  })

  it('handles an empty week', () => {
    expect(rowSummary({ label: 'You', days: Array(7).fill(false) }, NAMES)).toBe(
      'You: no days read yet',
    )
  })
})
