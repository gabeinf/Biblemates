-- Seed ledger: server-authoritative. Clients can read their own rows and never insert.
create table if not exists public.seed_ledger (
  user_id uuid not null references auth.users on delete cascade,
  amount int not null check (amount > 0),
  reason text not null check (reason in ('day', 'reflection')),
  ref text not null,
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref)
);
create index if not exists seed_ledger_user_idx on public.seed_ledger (user_id, created_at);

alter table public.seed_ledger enable row level security;
drop policy if exists seed_ledger_read_own on public.seed_ledger;
create policy seed_ledger_read_own on public.seed_ledger for select using (user_id = auth.uid());
-- No insert/update/delete policies on purpose: only the security-definer triggers below write.

-- Reflection ref = circle_study_id:day, so only the first shared reflection each day pays.
-- Keep these amounts in sync with apps/mobile/src/lib/seeds.ts.
create or replace function public.seed_on_day_completed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into seed_ledger (user_id, amount, reason, ref)
  values (new.user_id, 10, 'day', new.circle_study_id || ':' || new.day_number)
  on conflict (user_id, reason, ref) do nothing;
  return new;
end $$;
drop trigger if exists trg_seed_day on public.day_completions;
create trigger trg_seed_day after insert on public.day_completions
  for each row execute function public.seed_on_day_completed();

create or replace function public.seed_on_reflection() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.day_number is not null and new.circle_study_id is not null and new.visibility = 'circle' then
    insert into seed_ledger (user_id, amount, reason, ref)
    values (new.user_id, 5, 'reflection', new.circle_study_id || ':' || new.day_number)  -- one per user per day, no farming
    on conflict (user_id, reason, ref) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists trg_seed_reflection on public.reflections;
create trigger trg_seed_reflection after insert on public.reflections
  for each row execute function public.seed_on_reflection();
