-- One-time setup for push notifications. Run in the Supabase SQL editor AFTER:
--   1. supabase secrets set FUNCTION_SECRET=<long random string>
--   2. supabase functions deploy push --no-verify-jwt
--      supabase functions deploy daily-reminder --no-verify-jwt
--
-- Replace <PROJECT_REF> and <FUNCTION_SECRET> below. This file is NOT a migration
-- because it contains your secret — do not commit the filled-in version.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- 1) Activity -> push (fires on every new activity row)
create or replace function public.notify_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/push',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-function-secret', '<FUNCTION_SECRET>'),
    body := jsonb_build_object('type', 'INSERT', 'table', 'activity', 'record', to_jsonb(new))
  );
  return new;
end $$;

drop trigger if exists trg_notify_activity on public.activity;
create trigger trg_notify_activity after insert on public.activity
  for each row execute function public.notify_activity();

-- 2) Hourly daily-reminder sweep
select cron.unschedule('biblemates-daily-reminder')
where exists (select 1 from cron.job where jobname = 'biblemates-daily-reminder');

select cron.schedule(
  'biblemates-daily-reminder',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/daily-reminder',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-function-secret', '<FUNCTION_SECRET>'),
    body := '{}'::jsonb
  );
  $$
);
