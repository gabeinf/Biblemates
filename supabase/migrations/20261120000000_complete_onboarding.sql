-- Provider sign-in (Apple) creates the auth user before the app can attach the onboarding
-- answers, so handle_new_user never sees them. complete_onboarding applies the same answers
-- after the session exists, in one transaction, using the same logic as handle_new_user.

create or replace function public.apply_onboarding(uid uuid, d jsonb, display text)
returns void language plpgsql security definer set search_path = public as $$
declare
  c circles;
  default_study uuid;
begin
  update public.profiles set
    display_name = coalesce(display, display_name),
    intent = d ->> 'intent',
    referral_source = d #>> '{source,id}',
    referral_other = d #>> '{source,other}'
  where id = uid;

  if d ->> 'path' = 'join' then
    select * into c from circles where invite_code = upper(trim(d ->> 'inviteCode'));
    if c.id is null then raise exception 'No circle found for that code'; end if;
    insert into circle_members (circle_id, user_id) values (c.id, uid);
  elsif d ->> 'path' = 'create' then
    insert into circles (name, created_by, goal_days_per_week, stakes_kind, stakes_label)
    values (
      left(coalesce(display, 'My') || '''s circle', 60),
      uid,
      (d ->> 'daysPerWeek')::smallint,
      d #>> '{stakes,kind}',
      d #>> '{stakes,label}'
    ) returning * into c;
    insert into circle_members (circle_id, user_id, role) values (c.id, uid, 'owner');
    select id into default_study from studies order by slug = 'faith-over-fear' desc limit 1;
    if default_study is not null then
      insert into circle_studies (circle_id, study_id) values (c.id, default_study);
    end if;
  end if;
end $$;

revoke all on function public.apply_onboarding(uuid, jsonb, text) from public, anon, authenticated;

create or replace function public.complete_onboarding(answers jsonb, display text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  -- Returning users who already belong to a circle keep it; their answers aren't overwritten.
  if exists (select 1 from circle_members where user_id = auth.uid()) then return; end if;
  perform public.apply_onboarding(auth.uid(), answers, display);
end $$;

revoke all on function public.complete_onboarding(jsonb, text) from public, anon;
grant execute on function public.complete_onboarding(jsonb, text) to authenticated;
