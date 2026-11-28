import type { ComponentProps } from 'react'
import type Ionicons from '@expo/vector-icons/Ionicons'

type IconName = ComponentProps<typeof Ionicons>['name']

export type Species = { id: string; name: string; cost: number; icon: IconName }

/** Costs are enforced server-side in unlock_species; keep them in sync with the growth migration. */
export const SPECIES: Species[] = [
  { id: 'sprout', name: 'Sprout', cost: 0, icon: 'leaf-outline' },
  { id: 'clover', name: 'Clover', cost: 30, icon: 'leaf' },
  { id: 'tulip', name: 'Tulip', cost: 30, icon: 'flower-outline' },
  { id: 'oak', name: 'Oak', cost: 60, icon: 'earth' },
  { id: 'sunflower', name: 'Sunflower', cost: 60, icon: 'sunny' },
  { id: 'cherry', name: 'Cherry', cost: 100, icon: 'nutrition' },
]

export const DEFAULT_SPECIES = 'sprout'

export const getSpecies = (id: string) => SPECIES.find((s) => s.id === id)

const chosenKey = (userId: string) => `growth:species:${userId}`

/** Last species the user picked on this device; anything not in the catalog falls back to sprout. */
export function getChosenSpecies(userId: string): string {
  try {
    const id = globalThis.localStorage?.getItem(chosenKey(userId))
    return id && getSpecies(id) ? id : DEFAULT_SPECIES
  } catch {
    return DEFAULT_SPECIES
  }
}

export function setChosenSpecies(userId: string, id: string) {
  try {
    globalThis.localStorage?.setItem(chosenKey(userId), id)
  } catch {
    // best-effort, like reader-prefs
  }
}
