import { describe, expect, it } from '@jest/globals'
import { WEEKDAY_INITIALS_FALLBACK, weekdayInitials, weekdayNames } from './weekdays'

describe('weekdays', () => {
  it('starts on Monday in English', () => {
    expect(weekdayInitials('en-US')).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
    expect(weekdayNames('en-US')[0]).toBe('Monday')
    expect(weekdayNames('en-US')[6]).toBe('Sunday')
  })

  it('follows the locale', () => {
    expect(weekdayNames('de-DE')[0]).toBe('Montag')
  })

  it('falls back to the shared constant when the locale is unusable', () => {
    expect(weekdayInitials('not a locale!')).toEqual(WEEKDAY_INITIALS_FALLBACK)
    expect(weekdayNames('not a locale!')).toHaveLength(7)
  })
})
