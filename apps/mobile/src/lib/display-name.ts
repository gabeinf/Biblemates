/** Display names: what a circle calls someone (draft `displayName`, later `profiles`). */
export const DISPLAY_NAME_MAX = 30

/** The trimmed name with inner runs of spaces collapsed, or null if it's empty or too long. */
export function cleanDisplayName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ')
  return name.length >= 1 && name.length <= DISPLAY_NAME_MAX ? name : null
}
