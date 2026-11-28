// Row types mirroring supabase/migrations. Keep in sync when the schema changes
// (or replace with `supabase gen types typescript` output later).

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type Circle = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  /** Set by onboarding; null for circles created before it. */
  goal_days_per_week?: number | null;
  stakes_label?: string | null;
};

export type CircleMember = {
  circle_id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  profile: Profile | null;
};

export type Study = {
  id: string;
  slug: string;
  title: string;
  description: string;
  total_days: number;
};

export type StudyDay = {
  id: string;
  study_id: string;
  day_number: number;
  title: string;
  book_id: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  read_minutes: number;
  question: string;
};

export type CircleStudy = {
  id: string;
  circle_id: string;
  study_id: string;
  started_on: string;
  status: 'active' | 'completed';
  study: Study & { days: StudyDay[] };
};

export type DayCompletion = {
  user_id: string;
  circle_study_id: string;
  day_number: number;
  completed_at: string;
};

export type Visibility = 'private' | 'circle';

export type Reflection = {
  id: string;
  user_id: string;
  circle_id: string;
  circle_study_id: string | null;
  day_number: number | null;
  book_id: string | null;
  chapter: number | null;
  verse: number | null;
  body: string;
  visibility: Visibility;
  created_at: string;
  encouragements?: Encouragement[];
};

export type EncouragementKind = 'heart' | 'praying';

export type Encouragement = {
  id: string;
  circle_id: string;
  from_user: string;
  to_user: string;
  kind: EncouragementKind;
  reflection_id: string | null;
  prayer_request_id: string | null;
  created_at: string;
};

export type PrayerRequest = {
  id: string;
  circle_id: string;
  user_id: string;
  body: string;
  answered_at: string | null;
  created_at: string;
  encouragements?: Encouragement[];
};

export type Highlight = { user_id: string; book_id: string; chapter: number; verse: number; color: string };
export type Bookmark = { user_id: string; book_id: string; chapter: number; verse: number; created_at: string };

export type ActivityKind =
  | 'joined'
  | 'completed_reading'
  | 'shared_reflection'
  | 'prayer_request'
  | 'encouraged'
  | 'milestone';

export type Activity = {
  id: string;
  circle_id: string;
  actor_id: string;
  target_user_id: string | null;
  kind: ActivityKind;
  subject_id: string | null;
  meta: Record<string, any>;
  created_at: string;
};

export type NotificationPrefs = {
  user_id: string;
  daily_reminder: boolean;
  reminder_hour: number;
  circle_activity: boolean;
  encouragements: boolean;
  quiet_start: number | null;
  quiet_end: number | null;
  timezone: string;
};
