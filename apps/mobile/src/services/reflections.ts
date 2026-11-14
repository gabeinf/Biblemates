import { supabase } from '../lib/supabase';
import type { EncouragementKind, PrayerRequest, Reflection, Visibility } from '../types/db';

const WITH_ENCOURAGEMENTS = '*, encouragements(*)';

export async function getDayReflections(circleStudyId: string, dayNumber: number): Promise<Reflection[]> {
  const { data, error } = await supabase
    .from('reflections')
    .select(WITH_ENCOURAGEMENTS)
    .eq('circle_study_id', circleStudyId)
    .eq('day_number', dayNumber)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

/** All reflections (mine + circle-shared) on a chapter; the reader groups them by verse. */
export async function getChapterReflections(circleId: string, bookId: string, chapter: number): Promise<Reflection[]> {
  const { data, error } = await supabase
    .from('reflections')
    .select(WITH_ENCOURAGEMENTS)
    .eq('circle_id', circleId)
    .eq('book_id', bookId)
    .eq('chapter', chapter)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}

export type NewReflection = {
  circleId: string;
  body: string;
  visibility: Visibility;
  circleStudyId?: string;
  dayNumber?: number;
  bookId?: string;
  chapter?: number;
  verse?: number;
};

export async function createReflection(r: NewReflection) {
  const { error } = await supabase.from('reflections').insert({
    circle_id: r.circleId,
    body: r.body.trim(),
    visibility: r.visibility,
    circle_study_id: r.circleStudyId ?? null,
    day_number: r.dayNumber ?? null,
    book_id: r.bookId ?? null,
    chapter: r.chapter ?? null,
    verse: r.verse ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function deleteReflection(id: string) {
  const { error } = await supabase.from('reflections').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function encourage(params: {
  circleId: string;
  toUser: string;
  kind: EncouragementKind;
  reflectionId?: string;
  prayerRequestId?: string;
}) {
  const { error } = await supabase.from('encouragements').insert({
    circle_id: params.circleId,
    to_user: params.toUser,
    kind: params.kind,
    reflection_id: params.reflectionId ?? null,
    prayer_request_id: params.prayerRequestId ?? null,
  });
  // 23505 = already encouraged; treat as success.
  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function getPrayerRequests(circleId: string): Promise<PrayerRequest[]> {
  const { data, error } = await supabase
    .from('prayer_requests')
    .select(WITH_ENCOURAGEMENTS)
    .eq('circle_id', circleId)
    .is('answered_at', null)
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) throw new Error(error.message);
  return data;
}

export async function createPrayerRequest(circleId: string, body: string) {
  const { error } = await supabase.from('prayer_requests').insert({ circle_id: circleId, body: body.trim() });
  if (error) throw new Error(error.message);
}

export async function markPrayerAnswered(id: string) {
  const { error } = await supabase.from('prayer_requests').update({ answered_at: new Date().toISOString() }).eq('id', id);
  if (error) throw new Error(error.message);
}
