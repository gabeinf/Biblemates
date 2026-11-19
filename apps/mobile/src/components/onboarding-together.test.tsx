import { describe, expect, it } from '@jest/globals'
import { render, screen } from '@testing-library/react-native'
import { PreviewStack, ThisWeekCard, stackCardSize } from './onboarding-together'

const members = [
  { name: 'You', read: 3, goal: 3 },
  { name: 'Ana Reyes', read: 2, goal: 3 },
]
const highlights = [
  {
    name: 'Ana Reyes',
    day: 'Mon',
    verse: 'Verse one.',
    reference: 'Ref 1:1',
    color: 'gold' as const,
  },
  {
    name: 'Ben Cole',
    day: 'Tue',
    verse: 'Verse two.',
    reference: 'Ref 2:2',
    color: 'sky' as const,
  },
]

describe('ThisWeekCard', () => {
  it('shows each member with a count like 3/3 and the streak chip', async () => {
    await render(<ThisWeekCard members={members} streakWeeks={3} />)
    expect(screen.getByLabelText('You: 3 of 3 readings')).toBeTruthy()
    expect(screen.getByLabelText('Ana Reyes: 2 of 3 readings')).toBeTruthy()
    expect(screen.getByLabelText('3-week streak')).toBeTruthy()
  })
})

describe('PreviewStack', () => {
  it('shows the front card in full and describes it', async () => {
    await render(<PreviewStack highlights={highlights} />)
    expect(screen.getByLabelText('Example: Ben highlighted Ref 2:2')).toBeTruthy()
    expect(screen.getByText('Verse two.', { includeHiddenElements: true })).toBeTruthy()
    // Back cards are drawn as highlight bars, so their text never peeks out clipped.
    expect(screen.queryByText('Verse one.', { includeHiddenElements: true })).toBeNull()
  })

  it('uses the first three highlights at most', async () => {
    const many = [1, 2, 3, 4].map((n) => ({
      ...highlights[0],
      reference: `Ref ${n}`,
      verse: `V${n}`,
    }))
    await render(<PreviewStack highlights={many} />)
    expect(screen.getByLabelText('Example: Ana highlighted Ref 3')).toBeTruthy()
  })

  it('renders nothing without highlights', async () => {
    await render(<PreviewStack highlights={[]} />)
    expect(screen.toJSON()).toBeNull()
  })
})

describe('stackCardSize', () => {
  it('keeps the natural size before layout and on short screens', () => {
    expect(stackCardSize({ width: 0, height: 0 })).toEqual({ width: 236, height: 0 })
    expect(stackCardSize({ width: 327, height: 140 }).height).toBeLessThan(140)
  })

  it('grows tall to fill spare height, up to a cap', () => {
    expect(stackCardSize({ width: 342, height: 380 })).toEqual({ width: 294, height: 300 })
    expect(stackCardSize({ width: 342, height: 260 }).height).toBe(236)
  })

  it('keeps room for the fan on each side, within sensible widths', () => {
    expect(stackCardSize({ width: 200, height: 200 }).width).toBe(220)
    expect(stackCardSize({ width: 900, height: 200 }).width).toBe(320)
  })
})
