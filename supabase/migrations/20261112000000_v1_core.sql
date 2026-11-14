-- Biblemates v1 core schema
-- Circles, shared 7-day studies, reading progress, reflections, encouragement,
-- prayer requests, Bible highlights/bookmarks, push tokens and an activity feed.
--
-- Apply with:  supabase db push   (or paste into the SQL editor)
-- Everything here is idempotent where practical so it can be re-run safely.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles (may already exist from the auth quickstart)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do update set display_name = coalesce(public.profiles.display_name, excluded.display_name);
  insert into public.notification_prefs (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Circles
-- ---------------------------------------------------------------------------
create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_by uuid not null references auth.users on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  circle_id uuid not null references public.circles on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
-- MVP: one circle per user.
create unique index if not exists circle_members_one_circle on public.circle_members (user_id);

-- Security-definer helpers so RLS policies don't recurse through circle_members.
create or replace function public.is_circle_member(c uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from circle_members where circle_id = c and user_id = auth.uid());
$$;

create or replace function public.my_circle_id()
returns uuid language sql stable security definer set search_path = public as $$
  select circle_id from circle_members where user_id = auth.uid() limit 1;
$$;

create or replace function public.shares_circle_with(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from circle_members a join circle_members b on a.circle_id = b.circle_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- ---------------------------------------------------------------------------
-- Studies (content) and circle progress
-- ---------------------------------------------------------------------------
create table if not exists public.studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  total_days int not null check (total_days > 0)
);

create table if not exists public.study_days (
  id uuid primary key default gen_random_uuid(),
  study_id uuid not null references public.studies on delete cascade,
  day_number int not null,
  title text not null,
  book_id text not null,            -- USFM code, e.g. 'PRO', 'JHN'
  chapter int not null,
  verse_start int,
  verse_end int,
  read_minutes int not null default 3,
  question text not null,
  unique (study_id, day_number)
);

create table if not exists public.circle_studies (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles on delete cascade,
  study_id uuid not null references public.studies,
  started_on date not null default current_date,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now()
);
create unique index if not exists circle_studies_one_active
  on public.circle_studies (circle_id) where status = 'active';

create table if not exists public.day_completions (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  circle_study_id uuid not null references public.circle_studies on delete cascade,
  day_number int not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, circle_study_id, day_number)
);

-- ---------------------------------------------------------------------------
-- Reflections: answers to the day's question AND notes on individual verses.
-- visibility = 'private' -> only author; 'circle' -> whole circle.
-- ---------------------------------------------------------------------------
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  circle_id uuid not null references public.circles on delete cascade,
  circle_study_id uuid references public.circle_studies on delete cascade,
  day_number int,
  book_id text,
  chapter int,
  verse int,
  body text not null check (char_length(body) between 1 and 2000),
  visibility text not null default 'circle' check (visibility in ('private', 'circle')),
  created_at timestamptz not null default now(),
  check ((circle_study_id is not null and day_number is not null) or (book_id is not null and chapter is not null))
);
create index if not exists reflections_day_idx on public.reflections (circle_study_id, day_number);
create index if not exists reflections_verse_idx on public.reflections (circle_id, book_id, chapter);

-- ---------------------------------------------------------------------------
-- Prayer requests & encouragement
-- ---------------------------------------------------------------------------
create table if not exists public.prayer_requests (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles on delete cascade,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  body text not null check (char_length(body) between 1 and 1000),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.encouragements (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles on delete cascade,
  from_user uuid not null references auth.users on delete cascade default auth.uid(),
  to_user uuid not null references auth.users on delete cascade,
  kind text not null check (kind in ('heart', 'praying')),
  reflection_id uuid references public.reflections on delete cascade,
  prayer_request_id uuid references public.prayer_requests on delete cascade,
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);
create unique index if not exists encouragements_once_per_reflection
  on public.encouragements (from_user, reflection_id, kind) where reflection_id is not null;
create unique index if not exists encouragements_once_per_prayer
  on public.encouragements (from_user, prayer_request_id) where prayer_request_id is not null;

-- ---------------------------------------------------------------------------
-- Bible: highlights, bookmarks, last reading position
-- ---------------------------------------------------------------------------
create table if not exists public.highlights (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  book_id text not null,
  chapter int not null,
  verse int not null,
  color text not null default 'gold',
  created_at timestamptz not null default now(),
  primary key (user_id, book_id, chapter, verse)
);

create table if not exists public.bookmarks (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  book_id text not null,
  chapter int not null,
  verse int not null default 0,     -- 0 = whole chapter
  created_at timestamptz not null default now(),
  primary key (user_id, book_id, chapter, verse)
);

create table if not exists public.reading_positions (
  user_id uuid primary key references auth.users on delete cascade default auth.uid(),
  book_id text not null,
  chapter int not null,
  translation text not null default 'web',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists public.push_tokens (
  token text primary key,
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  platform text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users on delete cascade default auth.uid(),
  daily_reminder boolean not null default true,
  reminder_hour smallint not null default 8 check (reminder_hour between 0 and 23),
  circle_activity boolean not null default true,
  encouragements boolean not null default true,
  quiet_start smallint check (quiet_start between 0 and 23),
  quiet_end smallint check (quiet_end between 0 and 23),
  timezone text not null default 'America/New_York',
  last_reminder_on date
);

-- ---------------------------------------------------------------------------
-- Activity feed (written only by triggers; drives Home + push notifications)
-- ---------------------------------------------------------------------------
create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles on delete cascade,
  actor_id uuid not null references auth.users on delete cascade,
  target_user_id uuid references auth.users on delete cascade,
  kind text not null check (kind in (
    'joined', 'completed_reading', 'shared_reflection', 'prayer_request', 'encouraged', 'milestone'
  )),
  subject_id uuid,
  meta jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists activity_circle_idx on public.activity (circle_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers that populate activity
-- ---------------------------------------------------------------------------
create or replace function public.on_member_joined() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into activity (circle_id, actor_id, kind) values (new.circle_id, new.user_id, 'joined');
  return new;
end $$;
drop trigger if exists trg_member_joined on public.circle_members;
create trigger trg_member_joined after insert on public.circle_members
  for each row execute function public.on_member_joined();

create or replace function public.on_day_completed() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cs record;
  members int;
  finished int;
begin
  select c.circle_id, c.study_id, s.total_days, s.title, d.title as day_title
    into cs
    from circle_studies c
    join studies s on s.id = c.study_id
    left join study_days d on d.study_id = c.study_id and d.day_number = new.day_number
   where c.id = new.circle_study_id;

  insert into activity (circle_id, actor_id, kind, subject_id, meta)
  values (cs.circle_id, new.user_id, 'completed_reading', new.circle_study_id,
          jsonb_build_object('day_number', new.day_number, 'day_title', cs.day_title));

  -- Group milestone: everyone in the circle has finished the final day.
  if new.day_number = cs.total_days then
    select count(*) into members from circle_members where circle_id = cs.circle_id;
    select count(*) into finished from day_completions
      where circle_study_id = new.circle_study_id and day_number = cs.total_days;
    if finished >= members then
      update circle_studies set status = 'completed' where id = new.circle_study_id;
      insert into activity (circle_id, actor_id, kind, subject_id, meta)
      values (cs.circle_id, new.user_id, 'milestone', new.circle_study_id,
              jsonb_build_object('type', 'study_completed', 'study_title', cs.title));
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_day_completed on public.day_completions;
create trigger trg_day_completed after insert on public.day_completions
  for each row execute function public.on_day_completed();

create or replace function public.on_reflection_shared() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.visibility = 'circle' then
    insert into activity (circle_id, actor_id, kind, subject_id, meta)
    values (new.circle_id, new.user_id, 'shared_reflection', new.id,
            jsonb_build_object('book_id', new.book_id, 'chapter', new.chapter, 'verse', new.verse,
                               'day_number', new.day_number));
  end if;
  return new;
end $$;
drop trigger if exists trg_reflection_shared on public.reflections;
create trigger trg_reflection_shared after insert on public.reflections
  for each row execute function public.on_reflection_shared();

create or replace function public.on_prayer_request() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into activity (circle_id, actor_id, kind, subject_id)
  values (new.circle_id, new.user_id, 'prayer_request', new.id);
  return new;
end $$;
drop trigger if exists trg_prayer_request on public.prayer_requests;
create trigger trg_prayer_request after insert on public.prayer_requests
  for each row execute function public.on_prayer_request();

create or replace function public.on_encouraged() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into activity (circle_id, actor_id, target_user_id, kind, subject_id, meta)
  values (new.circle_id, new.from_user, new.to_user, 'encouraged',
          coalesce(new.reflection_id, new.prayer_request_id),
          jsonb_build_object('kind', new.kind));
  return new;
end $$;
drop trigger if exists trg_encouraged on public.encouragements;
create trigger trg_encouraged after insert on public.encouragements
  for each row execute function public.on_encouraged();

-- New-user trigger (profiles + default notification prefs)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------
create or replace function public.create_circle(circle_name text)
returns public.circles language plpgsql security definer set search_path = public as $$
declare
  c circles;
  default_study uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from circle_members where user_id = auth.uid()) then
    raise exception 'You are already in a circle';
  end if;
  insert into circles (name, created_by) values (circle_name, auth.uid()) returning * into c;
  insert into circle_members (circle_id, user_id, role) values (c.id, auth.uid(), 'owner');
  select id into default_study from studies order by slug = 'faith-over-fear' desc limit 1;
  if default_study is not null then
    insert into circle_studies (circle_id, study_id) values (c.id, default_study);
  end if;
  return c;
end $$;

create or replace function public.join_circle(code text)
returns public.circles language plpgsql security definer set search_path = public as $$
declare c circles;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select * into c from circles where invite_code = upper(trim(code));
  if c.id is null then raise exception 'No circle found for that code'; end if;
  if exists (select 1 from circle_members where user_id = auth.uid()) then
    raise exception 'You are already in a circle';
  end if;
  insert into circle_members (circle_id, user_id) values (c.id, auth.uid());
  return c;
end $$;

create or replace function public.leave_circle()
returns void language sql security definer set search_path = public as $$
  delete from circle_members where user_id = auth.uid();
$$;

-- Start the next study when the current one is done (owner only).
create or replace function public.start_study(p_study_id uuid)
returns public.circle_studies language plpgsql security definer set search_path = public as $$
declare cs circle_studies; cid uuid := my_circle_id();
begin
  if not exists (select 1 from circle_members where circle_id = cid and user_id = auth.uid() and role = 'owner') then
    raise exception 'Only the circle owner can start a study';
  end if;
  update circle_studies set status = 'completed' where circle_id = cid and status = 'active';
  insert into circle_studies (circle_id, study_id) values (cid, p_study_id) returning * into cs;
  return cs;
end $$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.studies enable row level security;
alter table public.study_days enable row level security;
alter table public.circle_studies enable row level security;
alter table public.day_completions enable row level security;
alter table public.reflections enable row level security;
alter table public.prayer_requests enable row level security;
alter table public.encouragements enable row level security;
alter table public.highlights enable row level security;
alter table public.bookmarks enable row level security;
alter table public.reading_positions enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.activity enable row level security;

-- helper macro-ish: drop then create so the file is re-runnable
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' and policyname like 'bm_%' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy bm_profiles_read on public.profiles for select
  using (id = auth.uid() or public.shares_circle_with(id));
create policy bm_profiles_update on public.profiles for update using (id = auth.uid());
create policy bm_profiles_insert on public.profiles for insert with check (id = auth.uid());

create policy bm_circles_read on public.circles for select using (public.is_circle_member(id));
create policy bm_circles_update on public.circles for update
  using (exists (select 1 from public.circle_members m where m.circle_id = id and m.user_id = auth.uid() and m.role = 'owner'));

create policy bm_members_read on public.circle_members for select using (public.is_circle_member(circle_id));

create policy bm_studies_read on public.studies for select using (auth.role() = 'authenticated');
create policy bm_study_days_read on public.study_days for select using (auth.role() = 'authenticated');

create policy bm_circle_studies_read on public.circle_studies for select using (public.is_circle_member(circle_id));

create policy bm_completions_read on public.day_completions for select
  using (exists (select 1 from public.circle_studies cs where cs.id = circle_study_id and public.is_circle_member(cs.circle_id)));
create policy bm_completions_insert on public.day_completions for insert
  with check (user_id = auth.uid() and exists (
    select 1 from public.circle_studies cs where cs.id = circle_study_id and public.is_circle_member(cs.circle_id)));
create policy bm_completions_delete on public.day_completions for delete using (user_id = auth.uid());

create policy bm_reflections_read on public.reflections for select
  using (user_id = auth.uid() or (visibility = 'circle' and public.is_circle_member(circle_id)));
create policy bm_reflections_insert on public.reflections for insert
  with check (user_id = auth.uid() and public.is_circle_member(circle_id));
create policy bm_reflections_update on public.reflections for update using (user_id = auth.uid());
create policy bm_reflections_delete on public.reflections for delete using (user_id = auth.uid());

create policy bm_prayer_read on public.prayer_requests for select using (public.is_circle_member(circle_id));
create policy bm_prayer_insert on public.prayer_requests for insert
  with check (user_id = auth.uid() and public.is_circle_member(circle_id));
create policy bm_prayer_update on public.prayer_requests for update using (user_id = auth.uid());
create policy bm_prayer_delete on public.prayer_requests for delete using (user_id = auth.uid());

create policy bm_encouragements_read on public.encouragements for select using (public.is_circle_member(circle_id));
create policy bm_encouragements_insert on public.encouragements for insert
  with check (from_user = auth.uid() and public.is_circle_member(circle_id) and public.shares_circle_with(to_user));

create policy bm_highlights_all on public.highlights for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bm_bookmarks_all on public.bookmarks for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bm_positions_all on public.reading_positions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bm_push_tokens_all on public.push_tokens for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bm_prefs_all on public.notification_prefs for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy bm_activity_read on public.activity for select using (public.is_circle_member(circle_id));

-- ---------------------------------------------------------------------------
-- Realtime: every meaningful action writes an activity row, so the app only
-- needs to listen to this one table to keep Home/Study live.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'activity') then
    alter publication supabase_realtime add table public.activity;
  end if;
end $$;
