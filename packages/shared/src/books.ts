/**
 * The 66-book Protestant canon: USFM code, display name, chapter count.
 * Used by apps/server (ingestion, citation checks).
 * apps/mobile still has its own copy in src/constants/books.ts; move it here
 * once Metro is set up to resolve workspace packages.
 */
export type BookId = string;

export interface BookInfo {
  id: BookId;
  name: string;
  chapters: number;
}

export const BOOKS: readonly BookInfo[] = [
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
  ['MAT', 'Matthew', 28], ['MRK', 'Mark', 16], ['LUK', 'Luke', 24], ['JHN', 'John', 21],
  ['ACT', 'Acts', 28], ['ROM', 'Romans', 16], ['1CO', '1 Corinthians', 16], ['2CO', '2 Corinthians', 13],
  ['GAL', 'Galatians', 6], ['EPH', 'Ephesians', 6], ['PHP', 'Philippians', 4], ['COL', 'Colossians', 4],
  ['1TH', '1 Thessalonians', 5], ['2TH', '2 Thessalonians', 3], ['1TI', '1 Timothy', 6], ['2TI', '2 Timothy', 4],
  ['TIT', 'Titus', 3], ['PHM', 'Philemon', 1], ['HEB', 'Hebrews', 13], ['JAS', 'James', 5],
  ['1PE', '1 Peter', 5], ['2PE', '2 Peter', 3], ['1JN', '1 John', 5], ['2JN', '2 John', 1],
  ['3JN', '3 John', 1], ['JUD', 'Jude', 1], ['REV', 'Revelation', 22],
].map(([id, name, chapters]) => ({ id: id as string, name: name as string, chapters: chapters as number }));

const byId = new Map(BOOKS.map((b) => [b.id, b]));

export function getBook(id: BookId): BookInfo {
  const book = byId.get(id);
  if (!book) throw new Error(`Unknown book id: ${id}`);
  return book;
}

/** "Philippians 4:4–7" */
export function formatPassage(bookId: BookId, chapter: number, verseStart: number, verseEnd: number) {
  const name = getBook(bookId).name;
  return verseEnd > verseStart ? `${name} ${chapter}:${verseStart}–${verseEnd}` : `${name} ${chapter}:${verseStart}`;
}
