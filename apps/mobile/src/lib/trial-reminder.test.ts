import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { canRemind, scheduleTrialReminder } from './trial-reminder'

const mockPerm = jest.fn<() => Promise<unknown>>()
const mockSchedule = jest.fn<(r: unknown) => Promise<unknown>>()
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: () => mockPerm(),
  scheduleNotificationAsync: (r: unknown) => mockSchedule(r),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe('trial reminder', () => {
  it('can remind only with notification permission', async () => {
    mockPerm.mockResolvedValueOnce({ status: 'granted' })
    expect(await canRemind()).toBe(true)
    mockPerm.mockResolvedValueOnce({ status: 'denied' })
    expect(await canRemind()).toBe(false)
    mockPerm.mockRejectedValueOnce(new Error('x'))
    expect(await canRemind()).toBe(false)
  })

  it('schedules a one-off notification at the given date and never throws', async () => {
    const date = new Date(2026, 0, 15)
    await scheduleTrialReminder(date)
    expect(mockSchedule.mock.calls[0][0]).toMatchObject({ trigger: { type: 'date', date } })
    mockSchedule.mockRejectedValueOnce(new Error('x'))
    await expect(scheduleTrialReminder(date)).resolves.toBeUndefined()
  })
})
