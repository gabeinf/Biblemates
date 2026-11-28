import { beforeEach, describe, expect, it } from '@jest/globals'
import {
  SPECIES,
  DEFAULT_SPECIES,
  getChosenSpecies,
  getSpecies,
  setChosenSpecies,
} from './species'

const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    clear: () => store.clear(),
  },
})

beforeEach(() => globalThis.localStorage?.clear())

describe('species catalog', () => {
  it('has the six species with the agreed costs, sprout free', () => {
    expect(SPECIES.map((s) => [s.id, s.cost])).toEqual([
      ['sprout', 0],
      ['clover', 30],
      ['tulip', 30],
      ['oak', 60],
      ['sunflower', 60],
      ['cherry', 100],
    ])
  })

  it('looks species up by id', () => {
    expect(getSpecies('oak')?.name).toBe('Oak')
    expect(getSpecies('nope')).toBeUndefined()
  })
})

describe('chosen species', () => {
  it('defaults to sprout, persists per user, and ignores unknown ids', () => {
    expect(getChosenSpecies('u1')).toBe(DEFAULT_SPECIES)
    setChosenSpecies('u1', 'tulip')
    expect(getChosenSpecies('u1')).toBe('tulip')
    expect(getChosenSpecies('u2')).toBe(DEFAULT_SPECIES)
    setChosenSpecies('u2', 'bogus')
    expect(getChosenSpecies('u2')).toBe(DEFAULT_SPECIES)
  })
})
