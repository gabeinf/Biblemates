/**
 * Ingest a Bible translation into public.scripture_chunks.
 *
 *   pnpm --filter @biblemates/server ingest                     # whole Bible (SCRIPTURE_TRANSLATION, default ASV)
 *   pnpm --filter @biblemates/server ingest --books=PHP,MAT     # just these books
 *   pnpm --filter @biblemates/server ingest --translation=web   # a different translation
 *   pnpm --filter @biblemates/server ingest --force             # re-embed chapters already stored
 *
 * Pipeline per chapter: fetch (bible-api.com, cached to .cache/) -> split into
 * 3–5 verse chunks -> embed in batches -> upsert on (translation, book, chapter,
 * verse_start). Re-running is safe: finished chapters are skipped, upserts never
 * duplicate, and stale chunks from an older chunking are removed.
 *
 * bible-api.com allows ~15 requests / 30s, so a cold full run takes ~45 minutes.
 * Chapters are cached on disk, so reruns don't hit the API again.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BOOKS, formatPassage, type BookInfo } from "@biblemates/shared";
import { embed, supabaseAdmin } from "../src/clients";
import { chunkVerses, type Verse } from "../src/chunk";
import { env } from "../src/env";

const args = process.argv.slice(2);
const TRANSLATION =
  args.find((a) => a.startsWith("--translation="))?.slice("--translation=".length).toLowerCase() ??
  env.SCRIPTURE_TRANSLATION;
const API = "https://bible-api.com/data";
const REQUEST_GAP_MS = 2100; // stay under 15 req / 30s
const EMBED_BATCH = 100;

const here = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(here, "../.cache/bible", TRANSLATION);

type Chunk = {
  translation: string;
  book_id: string;
  chapter: number;
  verse_start: number;
  verse_end: number;
  content: string;
};

// ---------------------------------------------------------------- args

const force = args.includes("--force");
const onlyBooks = args
  .find((a) => a.startsWith("--books="))
  ?.slice("--books=".length)
  .split(",")
  .map((s) => s.trim().toUpperCase());

const books: BookInfo[] = onlyBooks ? BOOKS.filter((b) => onlyBooks.includes(b.id)) : [...BOOKS];
if (onlyBooks && books.length !== onlyBooks.length) {
  const unknown = onlyBooks.filter((id) => !BOOKS.some((b) => b.id === id));
  throw new Error(`Unknown book id(s): ${unknown.join(", ")}`);
}

// ---------------------------------------------------------------- fetch

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let lastRequest = 0;

async function fetchChapter(bookId: string, chapter: number): Promise<Verse[]> {
  const file = path.join(CACHE_DIR, `${bookId}-${chapter}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));

  for (let attempt = 1; attempt <= 6; attempt++) {
    const wait = lastRequest + REQUEST_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();

    // The /data/{translation}/{BOOK}/{chapter} endpoint returns whole chapters,
    // including single-chapter books (the name-based endpoint treats "Jude 1" as verse 1).
    const res = await fetch(`${API}/${TRANSLATION}/${bookId}/${chapter}`);
    if (res.status === 429 || res.status >= 500) {
      const backoff = 15_000 * attempt;
      console.warn(`  ${bookId} ${chapter}: HTTP ${res.status}, retrying in ${backoff / 1000}s`);
      await sleep(backoff);
      continue;
    }
    if (!res.ok) throw new Error(`${bookId} ${chapter}: HTTP ${res.status}`);

    const data = (await res.json()) as { verses: { chapter: number; verse: number; text: string }[] };
    const verses = data.verses
      .filter((v) => v.chapter === chapter)
      .map((v) => ({ verse: v.verse, text: v.text.replace(/\s+/g, " ").trim() }))
      .filter((v) => v.text.length > 0)
      .sort((a, b) => a.verse - b.verse);
    if (!verses.length) throw new Error(`${bookId} ${chapter}: no verses returned`);

    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(file, JSON.stringify(verses));
    return verses;
  }
  throw new Error(`${bookId} ${chapter}: gave up after repeated rate limiting`);
}

// ---------------------------------------------------------------- chunk

function toChunks(bookId: string, chapter: number, verses: Verse[]): Chunk[] {
  return chunkVerses(verses).map((group) => ({
    translation: TRANSLATION,
    book_id: bookId,
    chapter,
    verse_start: group[0].verse,
    verse_end: group[group.length - 1].verse,
    content: group.map((v) => v.text).join(" "),
  }));
}

/** What gets embedded: the reference gives the model book/context signal. */
const embeddingInput = (c: Chunk) => `${formatPassage(c.book_id, c.chapter, c.verse_start, c.verse_end)}\n${c.content}`;

// ---------------------------------------------------------------- store

async function storeChapter(chunks: Chunk[]) {
  const vectors: number[][] = [];
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    vectors.push(...(await embed(chunks.slice(i, i + EMBED_BATCH).map(embeddingInput))));
  }
  const rows = chunks.map((c, i) => ({ ...c, embedding: vectors[i] }));

  const { error } = await supabaseAdmin
    .from("scripture_chunks")
    .upsert(rows, { onConflict: "translation,book_id,chapter,verse_start" });
  if (error) throw new Error(`upsert failed: ${error.message}`);

  // Remove rows left over from a different chunking of this chapter.
  const { book_id, chapter } = chunks[0];
  const starts = chunks.map((c) => c.verse_start).join(",");
  const { error: cleanupError } = await supabaseAdmin
    .from("scripture_chunks")
    .delete()
    .eq("translation", TRANSLATION)
    .eq("book_id", book_id)
    .eq("chapter", chapter)
    .not("verse_start", "in", `(${starts})`);
  if (cleanupError) throw new Error(`cleanup failed: ${cleanupError.message}`);
}

/** Chapters that already have embedded chunks, as "BOOK:chapter". */
async function finishedChapters(): Promise<Set<string>> {
  const done = new Set<string>();
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabaseAdmin
      .from("scripture_chunks")
      .select("book_id, chapter")
      .eq("translation", TRANSLATION)
      .not("embedding", "is", null)
      .order("id")
      .range(from, from + page - 1);
    if (error) throw new Error(`could not read existing chunks: ${error.message}`);
    for (const r of data) done.add(`${r.book_id}:${r.chapter}`);
    if (data.length < page) break;
  }
  return done;
}

// ---------------------------------------------------------------- main

async function main() {
  const done = force ? new Set<string>() : await finishedChapters();
  const totalChapters = books.reduce((n, b) => n + b.chapters, 0);
  console.log(
    `Ingesting ${TRANSLATION.toUpperCase()}: ${books.length} book(s), ${totalChapters} chapter(s)` +
      (done.size ? `, ${done.size} already stored (skipping)` : ""),
  );

  let chapters = 0;
  let chunkCount = 0;
  const started = Date.now();

  for (const book of books) {
    let bookChunks = 0;
    for (let ch = 1; ch <= book.chapters; ch++) {
      chapters++;
      if (done.has(`${book.id}:${ch}`)) continue;
      const verses = await fetchChapter(book.id, ch);
      const chunks = toChunks(book.id, ch, verses);
      await storeChapter(chunks);
      bookChunks += chunks.length;
      chunkCount += chunks.length;
    }
    const mins = ((Date.now() - started) / 60_000).toFixed(1);
    console.log(`  ${book.name.padEnd(16)} ${String(bookChunks).padStart(4)} chunks   [${chapters}/${totalChapters} chapters, ${mins} min]`);
  }

  console.log(`Done. Stored ${chunkCount} chunk(s) in ${((Date.now() - started) / 60_000).toFixed(1)} min.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
