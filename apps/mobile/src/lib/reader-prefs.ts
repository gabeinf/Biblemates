/**
 * On-device reader state (last chapter + translation) so the Bible tab can open
 * instantly on launch without waiting for the network. The server copy in
 * `reading_positions` is the cross-device fallback.
 */
import type { PassageRef, TranslationId } from '../types/bible';

const POSITION_KEY = 'bible:lastPosition';
const TRANSLATION_KEY = 'bible:translation';

function read(key: string) {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // best-effort
  }
}

export function getLastTranslation(): TranslationId {
  return (read(TRANSLATION_KEY) as TranslationId) || 'web';
}

export function setLastTranslation(t: TranslationId) {
  write(TRANSLATION_KEY, t);
}

export function getLastPosition(): PassageRef | null {
  const raw = read(POSITION_KEY);
  if (!raw) return null;
  try {
    const { bookId, chapter } = JSON.parse(raw);
    return typeof bookId === 'string' && typeof chapter === 'number' ? { bookId, chapter } : null;
  } catch {
    return null;
  }
}

export function setLastPosition(bookId: string, chapter: number) {
  write(POSITION_KEY, JSON.stringify({ bookId, chapter }));
}
