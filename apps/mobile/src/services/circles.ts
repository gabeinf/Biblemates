import { supabase } from '../lib/supabase';
import type { Activity, Circle, CircleMember, Profile } from '../types/db';

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

/** The (single) circle the current user belongs to, or null. */
export async function getMyCircle(userId: string): Promise<Circle | null> {
  const { data, error } = await supabase
    .from('circle_members')
    .select('circle:circles(*)')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.circle as unknown as Circle) ?? null;
}

export async function createCircle(name: string): Promise<Circle> {
  return unwrap(await supabase.rpc('create_circle', { circle_name: name.trim() }));
}

export async function joinCircle(code: string): Promise<Circle> {
  return unwrap(await supabase.rpc('join_circle', { code: code.trim().toUpperCase() }));
}

export async function leaveCircle(): Promise<void> {
  unwrap(await supabase.rpc('leave_circle'));
}

export async function getMembers(circleId: string): Promise<CircleMember[]> {
  const members = unwrap(
    await supabase.from('circle_members').select('*').eq('circle_id', circleId).order('joined_at'),
  ) as Omit<CircleMember, 'profile'>[];
  const profiles = unwrap(
    await supabase.from('profiles').select('id, display_name, avatar_url').in('id', members.map((m) => m.user_id)),
  ) as Profile[];
  return members.map((m) => ({ ...m, profile: profiles.find((p) => p.id === m.user_id) ?? null }));
}

export async function getActivity(circleId: string, limit = 20): Promise<Activity[]> {
  return unwrap(
    await supabase
      .from('activity')
      .select('*')
      .eq('circle_id', circleId)
      .order('created_at', { ascending: false })
      .limit(limit),
  );
}

