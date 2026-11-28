import { supabase } from '../lib/supabase';
import type { CircleStudy, DayCompletion, Study } from '../types/db';

export async function getActiveCircleStudy(circleId: string): Promise<CircleStudy | null> {
  const { data, error } = await supabase
    .from('circle_studies')
    .select('*, study:studies(*, days:study_days(*))')
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const cs = data as unknown as CircleStudy;
  cs.study.days.sort((a, b) => a.day_number - b.day_number);
  return cs;
}

export async function listStudies(): Promise<Study[]> {
  const { data, error } = await supabase.from('studies').select('*').order('title');
  if (error) throw new Error(error.message);
  return data;
}

export async function startStudy(studyId: string) {
  const { error } = await supabase.rpc('start_study', { p_study_id: studyId });
  if (error) throw new Error(error.message);
}

export async function getCompletions(circleStudyId: string): Promise<DayCompletion[]> {
  const { data, error } = await supabase.from('day_completions').select('*').eq('circle_study_id', circleStudyId);
  if (error) throw new Error(error.message);
  return data;
}

export async function markDayComplete(circleStudyId: string, dayNumber: number, species = 'sprout') {
  const { error } = await supabase
    .from('day_completions')
    .upsert({ circle_study_id: circleStudyId, day_number: dayNumber, species }, { ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}
