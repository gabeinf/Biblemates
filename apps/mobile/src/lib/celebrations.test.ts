import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { celebrationClosed, showCelebration } from './celebrations'

const router = { push: jest.fn(), replace: jest.fn() }
const href = (kind: string) => ({ pathname: '/celebrate', params: { kind } })

describe('showCelebration', () => {
  beforeEach(() => {
    router.push.mockClear()
    router.replace.mockClear()
    celebrationClosed('checkin')
    celebrationClosed('study')
  })

  it('opens one celebrate screen and ignores a duplicate', () => {
    showCelebration(router, 'checkin')
    showCelebration(router, 'checkin')
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('final-day finisher: study replaces the check-in instead of stacking', () => {
    showCelebration(router, 'checkin')
    showCelebration(router, 'study')
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.replace).toHaveBeenCalledWith(href('study'))
  })

  it('final-day finisher, milestone first: the late check-in is dropped', () => {
    showCelebration(router, 'study')
    showCelebration(router, 'checkin')
    expect(router.push).toHaveBeenCalledWith(href('study'))
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('the replaced check-in unmounting does not clear the study screen', () => {
    showCelebration(router, 'checkin')
    showCelebration(router, 'study')
    celebrationClosed('checkin')
    showCelebration(router, 'checkin')
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.replace).toHaveBeenCalledTimes(1)
  })

  it('opens again once the screen has closed', () => {
    showCelebration(router, 'checkin')
    celebrationClosed('checkin')
    showCelebration(router, 'checkin')
    expect(router.push).toHaveBeenCalledTimes(2)
  })
})
