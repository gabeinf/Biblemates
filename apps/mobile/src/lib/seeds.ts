export const SEEDS_PER_DAY = 10
export const SEEDS_PER_REFLECTION = 5

export type SeedRow = { amount: number }

export const sumSeeds = (rows: SeedRow[]) => rows.reduce((n, r) => n + r.amount, 0)

/** Local midnight as an ISO timestamp: the lower bound for "earned today". */
export const startOfTodayIso = (now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
