import { useSyncExternalStore } from 'react'

/**
 * One-shot "the first screen is ready" signal. Layouts call `markAppReady()`
 * instead of hiding the native splash themselves; <AnimatedSplash /> hands off
 * from the native splash and plays the exit animation.
 */
let ready = false
const listeners = new Set<() => void>()

export function markAppReady() {
  if (ready) return
  ready = true
  listeners.forEach((l) => l())
}

export function useAppReady() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => ready,
  )
}
