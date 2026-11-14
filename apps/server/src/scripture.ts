/**
 * Scripture retrieval: hybrid (semantic + full-text) search over
 * scripture_chunks, falling back to keyword-only search when embeddings are
 * slow or unavailable.
 */
import { MOODS, formatPassage, getMood, type MoodId, type Passage, type SearchResponse } from "@biblemates/shared";
import { embed } from "./clients";
import { pg } from "./db";
import { env } from "./env";

/** Hybrid search (embedding + RPC) must finish within this, or we fall back. */
export const HYBRID_TIMEOUT_MS = 10_000;
const KEYWORD_TIMEOUT_MS = 5_000;

type Row = {
  id: string;
  translation: string;
  book_id: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  content: string;
  score: number;
};

const toPassage = (r: Row): Passage => ({
  id: r.id,
  translation: r.translation,
  bookId: r.book_id,
  chapter: r.chapter,
  verseStart: r.verse_start,
  verseEnd: r.verse_end,
  reference: formatPassage(r.book_id, r.chapter, r.verse_start, r.verse_end),
  text: r.content,
  score: r.score,
});

/**
 * Turns free text into an OR query for websearch_to_tsquery, so the keyword
 * fallback matches passages containing any of the words instead of all of them.
 */
const FILLER = new Set(
  "and the but for are was were you your yours his her them they she him our out not all any can could would should feel feeling felt like just really very know want get got been have has had that this with what when about from like into than then there these those because today right now".split(
    " ",
  ),
);

export function anyWordQuery(text: string): string {
  const words = text
    .toLowerCase()
    .split(/[^a-z']+/)
    .map((w) => w.replace(/'/g, ""))
    .filter((w) => w.length > 2 && !FILLER.has(w));
  return [...new Set(words)].slice(0, 12).join(" or ");
}

/** Calls search_scripture over the warm direct connection; cancels the query if the signal fires. */
async function rpc(queryText: string, embedding: number[] | null, limit: number, signal: AbortSignal) {
  signal.throwIfAborted();
  const vector = embedding ? `[${embedding.join(",")}]` : null;
  const query = pg<Row[]>`
    select id, translation, book_id, chapter, verse_start, verse_end, content, score
    from search_scripture(${queryText}, ${vector}::extensions.vector, ${limit}, ${env.SCRIPTURE_TRANSLATION})`;
  const cancel = () => void query.cancel();
  signal.addEventListener("abort", cancel, { once: true });
  try {
    return (await query).map(toPassage);
  } catch (err) {
    throw new Error(`search_scripture failed: ${signal.aborted ? "timed out" : err instanceof Error ? err.message : err}`);
  } finally {
    signal.removeEventListener("abort", cancel);
  }
}

/**
 * Preloads every mood's passages at boot. Mood quick-replies then never touch
 * the database, whose shared CPU on the Free tier can stall searches for seconds.
 */
export async function warmUp() {
  const started = Date.now();
  for (const m of MOODS) await searchScripture({ mood: m.id, limit: 6 }).catch(() => {});
  console.log(`search warmed up (${MOODS.length} moods cached) in ${Date.now() - started}ms`);
}

export type ScriptureQuery = { query?: string; mood?: MoodId; limit: number };

// ---------------------------------------------------------------- cache

/** Results only change when the Bible is re-ingested, so a few hours is safe. */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CACHE_MAX = 500;
const cache = new Map<string, { at: number; value: SearchResponse }>();

export async function searchScripture(q: ScriptureQuery): Promise<SearchResponse> {
  const key = JSON.stringify([q.query?.trim().toLowerCase() ?? null, q.mood ?? null, q.limit]);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const value = await searchUncached(q);
  // Keyword-fallback results are a degraded answer; don't keep them.
  if (value.mode === "hybrid") {
    cache.delete(key);
    cache.set(key, { at: Date.now(), value });
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  }
  return value;
}

async function searchUncached({ query, mood, limit }: ScriptureQuery): Promise<SearchResponse> {
  const m = mood ? getMood(mood) : undefined;
  // Semantic side: the user's words, enriched by the mood's description.
  const semanticText = [m?.query, query].filter(Boolean).join("; ");
  // Full-text side: mood keywords (ASV wording) OR'd together; free text as typed.
  const fullText = m ? [m.keywords.join(" or "), query && anyWordQuery(query)].filter(Boolean).join(" or ") : query!;
  const base = { translation: env.SCRIPTURE_TRANSLATION };

  try {
    const signal = AbortSignal.timeout(HYBRID_TIMEOUT_MS);
    const [embedding] = await embed([semanticText], { signal });
    return { ...base, mode: "hybrid", passages: await rpc(fullText, embedding, limit, signal) };
  } catch (err) {
    console.warn(`hybrid search failed, using keyword fallback: ${err instanceof Error ? err.message : err}`);
  }

  const keywordText = m ? fullText : anyWordQuery(query!);
  const passages = await rpc(keywordText, null, limit, AbortSignal.timeout(KEYWORD_TIMEOUT_MS));
  return { ...base, mode: "keyword", passages };
}
