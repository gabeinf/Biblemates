export type CelebrationKind = 'checkin' | 'study'
type Nav = { push: (href: any) => void; replace: (href: any) => void }

// Which celebrate screen is up. Module-level because the check-in (Bible tab) and the study
// milestone (realtime in the layout) are fired from unrelated components.
let current: CelebrationKind | null = null

/** At most one celebrate screen: study replaces check-in (final-day finisher), nothing else stacks. */
export function showCelebration(router: Nav, kind: CelebrationKind) {
  if (current === kind || current === 'study') return
  const href = { pathname: '/celebrate', params: { kind } }
  if (current) router.replace(href)
  else router.push(href)
  current = kind
}

/** Called when a celebrate screen unmounts; a replaced screen must not clear its successor. */
export function celebrationClosed(kind: CelebrationKind) {
  if (current === kind) current = null
}
