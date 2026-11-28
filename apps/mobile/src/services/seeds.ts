import { supabase } from '../lib/supabase'
import { sumSeeds, startOfTodayIso } from '../lib/seeds'

/** RLS limits the ledger to the signed-in user's own rows. */
async function seedRows(since?: string) {
  let q = supabase.from('seed_ledger').select('amount')
  if (since) q = q.gte('created_at', since)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return data ?? []
}

export const getSeedBalance = async () => sumSeeds(await seedRows())

export const getSeedsEarnedToday = async () => sumSeeds(await seedRows(startOfTodayIso()))
