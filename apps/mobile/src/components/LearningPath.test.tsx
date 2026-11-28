import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { LearningPath } from './LearningPath'
import type { DayState } from './ui'

const days: DayState[] = ['done', 'missed', 'today', 'future', 'future']
const base = { days, todayNumber: 3, bubble: 'Start', partners: [], onStartToday: () => undefined }

describe('LearningPath nodes', () => {
  it('renders each state: done, missed (dot), today (bubble), upcoming (locked)', async () => {
    await render(<LearningPath {...base} />)
    expect(screen.getByLabelText('Day 1, done')).toBeTruthy()
    expect(screen.getByLabelText('Day 2, missed')).toBeTruthy()
    expect(screen.getByTestId('missed-dot-2')).toBeTruthy()
    expect(screen.getByLabelText('Day 3, today')).toBeTruthy()
    expect(screen.getByText('Start')).toBeTruthy()
    expect(screen.getByLabelText('Day 4, locked')).toBeTruthy()
    expect(screen.queryByText(/missed|behind|late/i)).toBeNull()
  })

  it('shows the in-progress bubble', async () => {
    await render(<LearningPath {...base} bubble="Continue, step 3 of 4" />)
    expect(screen.getByText('Continue, step 3 of 4')).toBeTruthy()
  })

  it('starts the session only from today’s node', async () => {
    const onStartToday = jest.fn()
    await render(<LearningPath {...base} onStartToday={onStartToday} />)
    for (const l of ['Day 1, done', 'Day 2, missed', 'Day 4, locked']) await fireEvent.press(screen.getByLabelText(l))
    expect(onStartToday).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByRole('button', { name: 'Day 3, today' }))
    expect(onStartToday).toHaveBeenCalledTimes(1)
  })

  it('once I am done, today is a check with a caption and no bubble or tap', async () => {
    const onStartToday = jest.fn()
    await render(
      <LearningPath
        {...base}
        days={['done', 'done', 'done', 'future', 'future']}
        caption="Done, waiting on Ann"
        onStartToday={onStartToday}
      />,
    )
    expect(screen.getByText('Done, waiting on Ann')).toBeTruthy()
    expect(screen.queryByText('Start')).toBeNull()
    await fireEvent.press(screen.getByLabelText('Day 3, done'))
    expect(onStartToday).not.toHaveBeenCalled()
  })

  it('puts partners who finished on today’s node', async () => {
    await render(<LearningPath {...base} partners={[{ id: 'u2', name: 'Ann Lee' }]} />)
    expect(screen.getByLabelText('Ann Lee finished')).toBeTruthy()
  })

  it('reports the centre of today’s cell for auto-scroll', async () => {
    const onTodayLayout = jest.fn()
    await render(<LearningPath {...base} onTodayLayout={onTodayLayout} />)
    await fireEvent(screen.getByTestId('path-day-3'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 200, width: 100, height: 120 } },
    })
    expect(onTodayLayout).toHaveBeenCalledWith(260)
  })
})
