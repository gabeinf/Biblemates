export type TranslationId = 'web' | 'kjv' | 'asv' | 'bbe' | 'ylt';

export interface BibleBook {
  /** USFM code, e.g. 'JHN'. This is what we store in the database. */
  id: string;
  name: string;
  chapters: number;
  testament: 'OT' | 'NT';
}

export interface BibleVerse {
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleChapter {
  translation: TranslationId;
  bookId: string;
  chapter: number;
  reference: string;
  verses: BibleVerse[];
}

export interface PassageRef {
  bookId: string;
  chapter: number;
  verseStart?: number | null;
  verseEnd?: number | null;
}

/** Raw shape returned by https://bible-api.com/data/{translation}/{BOOK}/{chapter} */
export interface BibleApiResponse {
  translation: { identifier: string; name: string; license: string };
  verses: { book_id: string; book: string; chapter: number; verse: number; text: string }[];
}
