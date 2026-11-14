/**
 * Bible text provider.
 *
 * MVP uses https://bible-api.com (public-domain translations, no key required,
 * ~15 requests / 30s per IP). Chapters are cached on-device in localStorage
 * (backed by expo-sqlite) so re-reading never hits the network.
 *
 * To switch providers (e.g. API.Bible / ESV once licensed), keep the exported
 * function signatures and swap the implementation of `fetchFromProvider`.
 */
import { getBook } from '../constants/books';
import type { BibleApiResponse, BibleChapter, TranslationId } from '../types/bible';

const BASE_URL = 'https://bible-api.com/data';
// v2: v1 entries came from the name-based endpoint, which cached only verse 1
// of single-chapter books (Obadiah, Philemon, 2–3 John, Jude).
const CACHE_PREFIX = 'bible:v2';

const cacheKey = (t: TranslationId, bookId: string, chapter: number) => `${CACHE_PREFIX}:${t}:${bookId}:${chapter}`;

function readCache(key: string): BibleChapter | null {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as BibleChapter) : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, value: BibleChapter) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Cache is best-effort.
  }
}

async function fetchFromProvider(translation: TranslationId, bookId: string, chapter: number): Promise<BibleChapter> {
  const book = getBook(bookId);
  // /data/{translation}/{BOOK}/{chapter} always returns the whole chapter, including
  // single-chapter books (the name-based endpoint reads "Jude 1" as verse 1).
  const res = await fetch(`${BASE_URL}/${translation}/${bookId}/${chapter}`);
  if (res.status === 429) throw new Error('Too many requests — try again in a few seconds.');
  if (!res.ok) throw new Error(`Couldn't load ${book.name} ${chapter} (${res.status})`);
  const data = (await res.json()) as BibleApiResponse;
  return {
    translation,
    bookId,
    chapter,
    reference: `${book.name} ${chapter}`,
    verses: data.verses
      .filter((v) => v.chapter === chapter)
      .map((v) => ({
        bookId,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text.replace(/\s+/g, ' ').trim(),
      }))
      .filter((v) => v.text.length > 0),
  };
}

export async function getChapter(translation: TranslationId, bookId: string, chapter: number): Promise<BibleChapter> {
  const key = cacheKey(translation, bookId, chapter);
  const cached = readCache(key);
  if (cached) return cached;
  const fresh = await fetchFromProvider(translation, bookId, chapter);
  writeCache(key, fresh);
  return fresh;
}
