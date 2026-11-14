import type { BibleBook, PassageRef, TranslationId } from '../types/bible';

export const TRANSLATIONS: { id: TranslationId; name: string }[] = [
  { id: 'web', name: 'World English Bible' },
  { id: 'kjv', name: 'King James Version' },
  { id: 'asv', name: 'American Standard Version' },
  { id: 'bbe', name: 'Bible in Basic English' },
  { id: 'ylt', name: "Young's Literal Translation" },
];

const OT: [string, string, number][] = [
  ['GEN', 'Genesis', 50], ['EXO', 'Exodus', 40], ['LEV', 'Leviticus', 27], ['NUM', 'Numbers', 36],
  ['DEU', 'Deuteronomy', 34], ['JOS', 'Joshua', 24], ['JDG', 'Judges', 21], ['RUT', 'Ruth', 4],
  ['1SA', '1 Samuel', 31], ['2SA', '2 Samuel', 24], ['1KI', '1 Kings', 22], ['2KI', '2 Kings', 25],
  ['1CH', '1 Chronicles', 29], ['2CH', '2 Chronicles', 36], ['EZR', 'Ezra', 10], ['NEH', 'Nehemiah', 13],
  ['EST', 'Esther', 10], ['JOB', 'Job', 42], ['PSA', 'Psalms', 150], ['PRO', 'Proverbs', 31],
  ['ECC', 'Ecclesiastes', 12], ['SNG', 'Song of Solomon', 8], ['ISA', 'Isaiah', 66], ['JER', 'Jeremiah', 52],
  ['LAM', 'Lamentations', 5], ['EZK', 'Ezekiel', 48], ['DAN', 'Daniel', 12], ['HOS', 'Hosea', 14],
  ['JOL', 'Joel', 3], ['AMO', 'Amos', 9], ['OBA', 'Obadiah', 1], ['JON', 'Jonah', 4],
  ['MIC', 'Micah', 7], ['NAM', 'Nahum', 3], ['HAB', 'Habakkuk', 3], ['ZEP', 'Zephaniah', 3],
  ['HAG', 'Haggai', 2], ['ZEC', 'Zechariah', 14], ['MAL', 'Malachi', 4],
];

const NT: [string, string, number][] = [
  ['MAT', 'Matthew', 28], ['MRK', 'Mark', 16], ['LUK', 'Luke', 24], ['JHN', 'John', 21],
  ['ACT', 'Acts', 28], ['ROM', 'Romans', 16], ['1CO', '1 Corinthians', 16], ['2CO', '2 Corinthians', 13],
  ['GAL', 'Galatians', 6], ['EPH', 'Ephesians', 6], ['PHP', 'Philippians', 4], ['COL', 'Colossians', 4],
  ['1TH', '1 Thessalonians', 5], ['2TH', '2 Thessalonians', 3], ['1TI', '1 Timothy', 6], ['2TI', '2 Timothy', 4],
  ['TIT', 'Titus', 3], ['PHM', 'Philemon', 1], ['HEB', 'Hebrews', 13], ['JAS', 'James', 5],
  ['1PE', '1 Peter', 5], ['2PE', '2 Peter', 3], ['1JN', '1 John', 5], ['2JN', '2 John', 1],
  ['3JN', '3 John', 1], ['JUD', 'Jude', 1], ['REV', 'Revelation', 22],
];

export const BOOKS: BibleBook[] = [
  ...OT.map(([id, name, chapters]) => ({ id, name, chapters, testament: 'OT' as const })),
  ...NT.map(([id, name, chapters]) => ({ id, name, chapters, testament: 'NT' as const })),
];

const byId = new Map(BOOKS.map((b) => [b.id, b]));

export function getBook(id: string): BibleBook {
  const book = byId.get(id);
  if (!book) throw new Error(`Unknown book id: ${id}`);
  return book;
}

/** "Proverbs 3:5–6", "John 15", "Psalms 23:1" */
export function formatRef(ref: PassageRef): string {
  const name = getBook(ref.bookId).name;
  if (!ref.verseStart) return `${name} ${ref.chapter}`;
  if (!ref.verseEnd || ref.verseEnd === ref.verseStart) return `${name} ${ref.chapter}:${ref.verseStart}`;
  return `${name} ${ref.chapter}:${ref.verseStart}–${ref.verseEnd}`;
}

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Parses free-text like "john 3:16", "1 cor 13", "ps 23", "Song 2:4-7".
 * Returns null if no book matches.
 */
export function parseReference(input: string): PassageRef | null {
  const m = input.trim().match(/^((?:[1-3]\s*)?[a-zA-Z][a-zA-Z .]*?)\s*(\d+)?(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/);
  if (!m) return null;
  const [, rawBook, ch, vs, ve] = m;
  const q = normalize(rawBook);
  if (!q) return null;
  const book =
    BOOKS.find((b) => normalize(b.name) === q || b.id.toLowerCase() === q) ??
    BOOKS.find((b) => normalize(b.name).startsWith(q));
  if (!book) return null;
  const chapter = Math.min(Math.max(Number(ch ?? 1), 1), book.chapters);
  return {
    bookId: book.id,
    chapter,
    verseStart: vs ? Number(vs) : null,
    verseEnd: ve ? Number(ve) : null,
  };
}

export function nextChapter(bookId: string, chapter: number): PassageRef | null {
  const book = getBook(bookId);
  if (chapter < book.chapters) return { bookId, chapter: chapter + 1 };
  const idx = BOOKS.indexOf(book);
  return idx < BOOKS.length - 1 ? { bookId: BOOKS[idx + 1].id, chapter: 1 } : null;
}

export function prevChapter(bookId: string, chapter: number): PassageRef | null {
  if (chapter > 1) return { bookId, chapter: chapter - 1 };
  const idx = BOOKS.indexOf(getBook(bookId));
  if (idx === 0) return null;
  const prev = BOOKS[idx - 1];
  return { bookId: prev.id, chapter: prev.chapters };
}
