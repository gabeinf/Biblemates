import { useSyncExternalStore } from 'react';

/**
 * Tiny global store for the native tab bar's visibility, so a screen (e.g. the
 * Bible reader) can tuck the bar away while the user reads.
 */
let hidden = false;
const listeners = new Set<() => void>();

export function setTabBarHidden(next: boolean) {
  if (next === hidden) return;
  hidden = next;
  listeners.forEach((l) => l());
}

export function useTabBarHidden() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => hidden,
  );
}
