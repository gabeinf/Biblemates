import { supabase } from '../lib/supabase';
import type { Bookmark, Highlight } from '../types/db';
import type { TranslationId } from '../types/bible';
import { setLastPosition } from '../lib/reader-prefs';

export async function getChapterHighlights(bookId: string, chapter: number): Promise<Highlight[]> {
  const { data, error } = await supabase.from('highlights').select('*').eq('book_id', bookId).eq('chapter', chapter);
  if (error) throw new Error(error.message);
  return data;
}

export async function setHighlight(bookId: string, chapter: number, verse: number, color: string | null) {
  const { error } = color
    ? await supabase.from('highlights').upsert({ book_id: bookId, chapter, verse, color })
    : await supabase.from('highlights').delete().match({ book_id: bookId, chapter, verse });
  if (error) throw new Error(error.message);
}

export async function getBookmarks(): Promise<Bookmark[]> {
  const { data, error } = await supabase.from('bookmarks').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export async function toggleBookmark(bookId: string, chapter: number, verse: number, on: boolean) {
  const { error } = on
    ? await supabase.from('bookmarks').upsert({ book_id: bookId, chapter, verse })
    : await supabase.from('bookmarks').delete().match({ book_id: bookId, chapter, verse });
  if (error) throw new Error(error.message);
}

export type ReadingPosition = { book_id: string; chapter: number; translation: TranslationId };

export async function getReadingPosition(): Promise<ReadingPosition | null> {
  const { data, error } = await supabase.from('reading_positions').select('book_id, chapter, translation').maybeSingle();
  if (error) throw new Error(error.message);
  return data as ReadingPosition | null;
}

export async function saveReadingPosition(pos: ReadingPosition) {
  setLastPosition(pos.book_id, pos.chapter);
  const { error } = await supabase
    .from('reading_positions')
    .upsert({ ...pos, updated_at: new Date().toISOString() });
  if (error) console.warn('saveReadingPosition', error.message);
}
