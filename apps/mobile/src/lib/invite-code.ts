/**
 * Circle invite codes, shared as a code, a link or a message. The database makes them
 * from an md5 hash (circles.invite_code), so a real code is 6 uppercase hex characters.
 */
export const INVITE_CODE_LENGTH = 6
const CODE = /^[0-9A-F]{6}$/

export function isInviteCode(code: string): boolean {
  return CODE.test(code)
}

/** True once the code holds a character no real code has (G–Z, e.g. an O typed for a zero). */
export function hasNonHex(code: string): boolean {
  return /[^0-9A-F]/.test(code)
}

/**
 * Uppercase letters and digits only, capped at 6: what the field shows while typing.
 * Non-hex letters are kept (not dropped) so the field can point them out.
 */
export function sanitizeCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, INVITE_CODE_LENGTH)
}

/**
 * Pulls the code out of whatever was typed or pasted: a bare code, an invite link
 * (`…/onboarding/join?code=AB12CD`), or a shared message ("…use invite code AB12CD.").
 * Returns null for pasted text (a link or sentence) that has no code in it.
 */
export function extractInviteCode(raw: string): string | null {
  const text = raw.trim()
  const fromParam = text.match(/[?&]code=([A-Za-z0-9]{6})(?![A-Za-z0-9])/)
  if (fromParam) return fromParam[1].toUpperCase()
  const fromMessage = text.match(/\bcode\W{0,3}([A-Za-z0-9]{6})\b/i)
  if (fromMessage) return fromMessage[1].toUpperCase()
  // "My code is 7BC2E0": a standalone, already-uppercase hex token. Case-sensitive so
  // ordinary words don't match.
  const standalone = text.length > INVITE_CODE_LENGTH ? text.match(/\b[0-9A-F]{6}\b/) : null
  if (standalone) return standalone[0]
  // Typing past 6 characters just stops at 6; a longer link or sentence without a code is junk.
  const looksPasted = /[\s/:?&=]/.test(text)
  if (looksPasted && text.replace(/[^A-Za-z0-9]/g, '').length > INVITE_CODE_LENGTH) return null
  return sanitizeCode(text)
}
