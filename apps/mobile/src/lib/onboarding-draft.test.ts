import { beforeEach, describe, expect, it } from '@jest/globals'
import {
  clearDraft,
  getDraft,
  mergeDraft,
  resetDraftCacheForTests,
  updateDraft,
} from './onboarding-draft'

const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  },
})

beforeEach(() => {
  store.clear()
  resetDraftCacheForTests()
})

describe('mergeDraft', () => {
  it('adds fields without touching the others', () => {
    expect(mergeDraft({ intent: 'peace' }, { daysPerWeek: 3 })).toEqual({
      intent: 'peace',
      daysPerWeek: 3,
    })
  })

  it('removes fields set to undefined', () => {
    expect(
      mergeDraft({ path: 'join', inviteCode: 'ABC123' }, { path: 'create', inviteCode: undefined }),
    ).toEqual({
      path: 'create',
    })
  })
})

describe('draft store', () => {
  it('keeps answers while the app is open', () => {
    updateDraft({ step: 7, intent: 'habit' })
    updateDraft({ step: 8 })
    expect(getDraft()).toEqual({ step: 8, intent: 'habit' })
  })

  it('starts over when the app is closed and reopened', () => {
    updateDraft({ step: 7, intent: 'habit' })
    resetDraftCacheForTests() // simulate the app being killed and reopened
    expect(getDraft()).toEqual({})
  })

  it('never writes to storage, and deletes a draft an older build saved', () => {
    store.set('onboarding:draft', JSON.stringify({ step: 7 }))
    expect(getDraft()).toEqual({})
    expect(store.has('onboarding:draft')).toBe(false)
    updateDraft({ step: 9 })
    expect(store.size).toBe(0)
  })

  it('clearDraft wipes the draft', () => {
    updateDraft({ step: 12 })
    clearDraft()
    expect(getDraft()).toEqual({})
  })
})
