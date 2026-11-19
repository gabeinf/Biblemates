-- Onboarding 19: the answers collected before sign-up travel in the sign-up call itself
-- (auth user_metadata.onboarding) and are applied by handle_new_user in the same transaction.
-- That keeps the write atomic, and it survives email confirmation (no session needed).

alter table public.circles add column if not exists goal_days_per_week smallint
  check (goal_days_per_week between 1 and 7);
alter table public.circles add column if not exists stakes_kind text
  check (stakes_kind in ('preset', 'custom'));
alter table public.circles add column if not exists stakes_label text
  check (char_length(stakes_label) between 1 and 40);

alter table public.profiles add column if not exists intent text;
alter table public.profiles add column if not exists referral_source text;
alter table public.profiles add column if not exists referral_other text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  d jsonb := new.raw_user_meta_data -> 'onboarding';
  display text := coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1));
  c circles;
  default_study uuid;
begin
  insert into public.profiles (id, display_name, intent, referral_source, referral_other)
  values (new.id, display, d ->> 'intent', d #>> '{source,id}', d #>> '{source,other}')
  on conflict (id) do update set
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    intent = excluded.intent,
    referral_source = excluded.referral_source,
    referral_other = excluded.referral_other;
  insert into public.notification_prefs (user_id) values (new.id) on conflict do nothing;

  if d ->> 'path' = 'join' then
    select * into c from circles where invite_code = upper(trim(d ->> 'inviteCode'));
    -- Raising aborts the sign-up, so the app can show the error and keep the user on step 19.
    if c.id is null then raise exception 'No circle found for that code'; end if;
    insert into circle_members (circle_id, user_id) values (c.id, new.id);
  elsif d ->> 'path' = 'create' then
    insert into circles (name, created_by, goal_days_per_week, stakes_kind, stakes_label)
    values (
      left(coalesce(display, 'My') || '''s circle', 60),
      new.id,
      (d ->> 'daysPerWeek')::smallint,
      d #>> '{stakes,kind}',
      d #>> '{stakes,label}'
    ) returning * into c;
    insert into circle_members (circle_id, user_id, role) values (c.id, new.id, 'owner');
    select id into default_study from studies order by slug = 'faith-over-fear' desc limit 1;
    if default_study is not null then
      insert into circle_studies (circle_id, study_id) values (c.id, default_study);
    end if;
  end if;
  return new;
end $$;
