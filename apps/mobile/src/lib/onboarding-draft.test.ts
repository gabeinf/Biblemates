import { beforeEach, describe, expect, it } from '@jest/globals'
import {
  clearDraft,
  getDraft,
  mergeDraft,
  parseDraft,
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

describe('parseDraft', () => {
  it('returns an empty draft for missing, corrupt or invalid data', () => {
    expect(parseDraft(null)).toEqual({})
    expect(parseDraft('{not json')).toEqual({})
    expect(parseDraft(JSON.stringify({ daysPerWeek: 9 }))).toEqual({})
  })

  it('keeps a valid draft', () => {
    const draft = { step: 'join', path: 'join', inviteCode: 'ABC123', daysPerWeek: 4 }
    expect(parseDraft(JSON.stringify(draft))).toEqual(draft)
  })
})

describe('draft store', () => {
  it('survives a restart: saved answers come back from storage', () => {
    updateDraft({ step: 7, intent: 'habit' })
    updateDraft({ step: 8 })

    resetDraftCacheForTests() // simulate the app being killed and reopened
    expect(getDraft()).toEqual({ step: 8, intent: 'habit' })
  })

  it('clearDraft wipes storage and memory', () => {
    updateDraft({ step: 12 })
    clearDraft()
    expect(getDraft()).toEqual({})
    resetDraftCacheForTests()
    expect(getDraft()).toEqual({})
  })
})
