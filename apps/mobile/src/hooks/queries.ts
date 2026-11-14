/**
 * React Query hooks — the only place screens should get server data from.
 * Query keys live in `qk` so invalidation (including realtime) stays consistent.
 */
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getLastPosition, getLastTranslation } from '../lib/reader-prefs';
import { useEffect } from 'react';
import { Image } from 'react-native';
import { currentDayNumber } from '../lib/study-day';
import { supabase } from '../lib/supabase';
import { useAuthContext, useUserId } from './use-auth-context';
import * as circles from '../services/circles';
import * as study from '../services/study';
import * as refl from '../services/reflections';
import * as notes from '../services/annotations';
import * as notif from '../services/notifications';
import * as scripture from '../services/scripture';
import * as chat from '../services/chat';
import { getChapter } from '../services/bibleAPI';
import type { TranslationId } from '../types/bible';
import type { NotificationPrefs } from '../types/db';

export const qk = {
  circle: (userId: string) => ['circle', userId] as const,
  members: (circleId: string) => ['members', circleId] as const,
  activity: (circleId: string) => ['activity', circleId] as const,
  circleStudy: (circleId: string) => ['circleStudy', circleId] as const,
  studies: ['studies'] as const,
  completions: (csId: string) => ['completions', csId] as const,
  dayReflections: (csId: string, day: number) => ['reflections', 'day', csId, day] as const,
  chapterReflections: (circleId: string, bookId: string, chapter: number) =>
    ['reflections', 'chapter', circleId, bookId, chapter] as const,
  prayers: (circleId: string) => ['prayers', circleId] as const,
  chapter: (t: TranslationId, bookId: string, chapter: number) => ['bible', t, bookId, chapter] as const,
  highlights: (bookId: string, chapter: number) => ['highlights', bookId, chapter] as const,
  bookmarks: ['bookmarks'] as const,
  readingPosition: ['readingPosition'] as const,
  prefs: (userId: string) => ['prefs', userId] as const,
  conversations: ['conversations'] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
};

// ---------------------------------------------------------------- circle

export function useMyCircle() {
  const { userId } = useAuthContext();
  return useQuery({
    queryKey: qk.circle(userId ?? 'anon'),
    queryFn: () => circles.getMyCircle(userId!),
    enabled: !!userId,
  });
}

/** Use inside (tabs) where a circle is guaranteed by the layout guard. */
export function useCircle() {
  const { data } = useMyCircle();
  if (!data) throw new Error('useCircle used outside a circle-guarded route');
  return data;
}

export function useMembers(circleId: string) {
  return useQuery({ queryKey: qk.members(circleId), queryFn: () => circles.getMembers(circleId) });
}

export function useActivity(circleId: string) {
  return useQuery({ queryKey: qk.activity(circleId), queryFn: () => circles.getActivity(circleId) });
}

export function useCreateCircle() {
  const qc = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: circles.createCircle,
    onSuccess: (c) => qc.setQueryData(qk.circle(userId), c),
  });
}

export function useJoinCircle() {
  const qc = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: circles.joinCircle,
    onSuccess: (c) => qc.setQueryData(qk.circle(userId), c),
  });
}

export function useLeaveCircle() {
  const qc = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: circles.leaveCircle,
    onSuccess: () => qc.setQueryData(qk.circle(userId), null),
  });
}

/**
 * Subscribes to the circle's activity stream. Every meaningful action writes an
 * activity row (via DB triggers), so one channel is enough to keep Home and
 * Study fresh while the app is open.
 */
export function useCircleRealtime(circleId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!circleId) return;
    const channel = supabase
      .channel(`circle:${circleId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity', filter: `circle_id=eq.${circleId}` },
        () => {
          qc.invalidateQueries({ queryKey: qk.activity(circleId) });
          qc.invalidateQueries({ queryKey: ['completions'] });
          qc.invalidateQueries({ queryKey: ['reflections'] });
          qc.invalidateQueries({ queryKey: qk.prayers(circleId) });
          qc.invalidateQueries({ queryKey: qk.members(circleId) });
          qc.invalidateQueries({ queryKey: qk.circleStudy(circleId) });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [circleId, qc]);
}

// ---------------------------------------------------------------- study

export function useCircleStudy(circleId: string) {
  return useQuery({ queryKey: qk.circleStudy(circleId), queryFn: () => study.getActiveCircleStudy(circleId) });
}

export function useStudies() {
  return useQuery({ queryKey: qk.studies, queryFn: study.listStudies });
}

export function useStartStudy(circleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: study.startStudy,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.circleStudy(circleId) }),
  });
}

export function useCompletions(csId: string | undefined) {
  return useQuery({
    queryKey: qk.completions(csId ?? ''),
    queryFn: () => study.getCompletions(csId!),
    enabled: !!csId,
  });
}

export function useMarkDayComplete(csId: string) {
  const qc = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (day: number) => study.markDayComplete(csId, day),
    onMutate: async (day) => {
      // Optimistic: the checkmark should feel instant.
      const key = qk.completions(csId);
      await qc.cancelQueries({ queryKey: key });
      qc.setQueryData(key, (old: any[] = []) => [
        ...old,
        { user_id: userId, circle_study_id: csId, day_number: day, completed_at: new Date().toISOString() },
      ]);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.completions(csId) }),
  });
}

// ---------------------------------------------------------------- reflections & prayer

export function useDayReflections(csId: string | undefined, day: number | undefined) {
  return useQuery({
    queryKey: qk.dayReflections(csId ?? '', day ?? 0),
    queryFn: () => refl.getDayReflections(csId!, day!),
    enabled: !!csId && !!day,
  });
}

export function useChapterReflections(circleId: string, bookId: string, chapter: number) {
  return useQuery({
    queryKey: qk.chapterReflections(circleId, bookId, chapter),
    queryFn: () => refl.getChapterReflections(circleId, bookId, chapter),
  });
}

export function useCreateReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: refl.createReflection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reflections'] }),
  });
}

export function useDeleteReflection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: refl.deleteReflection,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reflections'] }),
  });
}

export function useEncourage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: refl.encourage,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['reflections'] });
      qc.invalidateQueries({ queryKey: qk.prayers(vars.circleId) });
    },
  });
}

export function usePrayerRequests(circleId: string) {
  return useQuery({ queryKey: qk.prayers(circleId), queryFn: () => refl.getPrayerRequests(circleId) });
}

export function useCreatePrayerRequest(circleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => refl.createPrayerRequest(circleId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.prayers(circleId) }),
  });
}

export function useMarkPrayerAnswered(circleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: refl.markPrayerAnswered,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.prayers(circleId) }),
  });
}

// ---------------------------------------------------------------- bible

export function useChapter(translation: TranslationId, bookId: string, chapter: number) {
  return useQuery({
    queryKey: qk.chapter(translation, bookId, chapter),
    queryFn: () => getChapter(translation, bookId, chapter),
    staleTime: Infinity,
    retry: 1,
  });
}

export function useHighlights(bookId: string, chapter: number) {
  return useQuery({
    queryKey: qk.highlights(bookId, chapter),
    queryFn: () => notes.getChapterHighlights(bookId, chapter),
  });
}

export function useSetHighlight(bookId: string, chapter: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ verse, color }: { verse: number; color: string | null }) =>
      notes.setHighlight(bookId, chapter, verse, color),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.highlights(bookId, chapter) }),
  });
}

export function useBookmarks() {
  return useQuery({ queryKey: qk.bookmarks, queryFn: notes.getBookmarks });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { bookId: string; chapter: number; verse: number; on: boolean }) =>
      notes.toggleBookmark(p.bookId, p.chapter, p.verse, p.on),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.bookmarks }),
  });
}

export function useReadingPosition() {
  return useQuery({ queryKey: qk.readingPosition, queryFn: notes.getReadingPosition, staleTime: Infinity });
}

// ---------------------------------------------------------------- launch warm-up

/**
 * Runs while the splash screen is up: loads Home's data and the Bible chapter
 * the user was last reading, so both tabs render fully on first paint.
 * Uses the same keys/fns as the hooks above, so the screens read from cache.
 */
export async function prefetchLaunchData(qc: QueryClient, circleId: string) {
  const home = (async () => {
    const members = (async () => {
      const list = await qc.fetchQuery({ queryKey: qk.members(circleId), queryFn: () => circles.getMembers(circleId) });
      // Download avatar photos too, so Home's faces don't pop in after the splash.
      const uris = list.map((m) => m.profile?.avatar_url).filter((u): u is string => !!u);
      await Promise.allSettled(uris.map((u) => Image.prefetch(u)));
    })();
    const cs = await qc.fetchQuery({ queryKey: qk.circleStudy(circleId), queryFn: () => study.getActiveCircleStudy(circleId) });
    const day = cs ? currentDayNumber(cs) : undefined;
    await Promise.allSettled([
      members,
      qc.prefetchQuery({ queryKey: qk.activity(circleId), queryFn: () => circles.getActivity(circleId) }),
      qc.prefetchQuery({ queryKey: qk.prayers(circleId), queryFn: () => refl.getPrayerRequests(circleId) }),
      cs && qc.prefetchQuery({ queryKey: qk.completions(cs.id), queryFn: () => study.getCompletions(cs.id) }),
      cs && day && qc.prefetchQuery({ queryKey: qk.dayReflections(cs.id, day), queryFn: () => refl.getDayReflections(cs.id, day) }),
    ]);
  })();

  const bible = (async () => {
    let pos = getLastPosition();
    if (!pos) {
      const server = await qc.fetchQuery({ queryKey: qk.readingPosition, queryFn: notes.getReadingPosition });
      pos = server ? { bookId: server.book_id, chapter: server.chapter } : { bookId: 'JHN', chapter: 1 };
    }
    const { bookId, chapter } = pos;
    const t = getLastTranslation();
    await Promise.all([
      qc.prefetchQuery({ queryKey: qk.chapter(t, bookId, chapter), queryFn: () => getChapter(t, bookId, chapter), staleTime: Infinity }),
      qc.prefetchQuery({ queryKey: qk.highlights(bookId, chapter), queryFn: () => notes.getChapterHighlights(bookId, chapter) }),
      qc.prefetchQuery({
        queryKey: qk.chapterReflections(circleId, bookId, chapter),
        queryFn: () => refl.getChapterReflections(circleId, bookId, chapter),
      }),
    ]);
  })();

  await Promise.allSettled([home, bible]);
}

// ---------------------------------------------------------------- notifications

export function usePrefs() {
  const userId = useUserId();
  return useQuery({ queryKey: qk.prefs(userId), queryFn: () => notif.getPrefs(userId) });
}

export function useUpdatePrefs() {
  const qc = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: (patch: Partial<NotificationPrefs>) => notif.updatePrefs(userId, patch),
    onMutate: (patch) => {
      qc.setQueryData(qk.prefs(userId), (old: NotificationPrefs | undefined) => (old ? { ...old, ...patch } : old));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.prefs(userId) }),
  });
}

// ---------------------------------------------------------------- scripture

/** Mood / free-text Scripture search via apps/server. A mutation: each tap is a fresh search. */
export function useScriptureSearch() {
  return useMutation({ mutationFn: scripture.searchScripture });
}

// ---------------------------------------------------------------- scripture chat

export function useConversations() {
  return useQuery({ queryKey: qk.conversations, queryFn: chat.listConversations });
}

export function useConversationMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: qk.messages(conversationId ?? ''),
    queryFn: () => chat.getMessages(conversationId!),
    enabled: !!conversationId,
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chat.deleteConversation,
    onMutate: (id) => {
      qc.setQueryData(qk.conversations, (old: chat.ConversationSummary[] | undefined) => old?.filter((c) => c.id !== id));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.conversations }),
  });
}
