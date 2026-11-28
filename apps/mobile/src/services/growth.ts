import { supabase } from '../lib/supabase'
import { DEFAULT_SPECIES } from '../lib/species'

/** RLS limits rows to the signed-in user. Sprout is always free, so it is always included. */
export async function getUnlockedSpecies(): Promise<string[]> {
  const { data, error } = await supabase.from('unlocked_species').select('species')
  if (error) throw new Error(error.message)
  return [DEFAULT_SPECIES, ...(data ?? []).map((r) => r.species as string)]
}

/** Spends the catalog cost server-side; throws 'not enough seeds' when the balance is too low. */
export async function unlockSpecies(species: string) {
  const { error } = await supabase.rpc('unlock_species', { p_species: species })
  if (error) throw new Error(error.message)
}
