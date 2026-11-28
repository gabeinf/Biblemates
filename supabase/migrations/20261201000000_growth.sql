-- Growth loop: chosen species per completed day, species unlocked by spending Seeds.
-- Keep the catalog costs in sync with apps/mobile/src/lib/species.ts.

alter table public.day_completions add column if not exists species text not null default 'sprout';

create table if not exists public.unlocked_species (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  species text not null,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, species)
);
alter table public.unlocked_species enable row level security;
drop policy if exists unlocked_species_read_own on public.unlocked_species;
create policy unlocked_species_read_own on public.unlocked_species for select using (user_id = auth.uid());
-- No write policies: only unlock_species (security definer) inserts.

-- Spending is a negative ledger row, so balance stays sum(amount).
alter table public.seed_ledger drop constraint if exists seed_ledger_amount_check;
alter table public.seed_ledger drop constraint if exists seed_ledger_reason_check;
alter table public.seed_ledger add constraint seed_ledger_reason_check
  check (reason in ('day', 'reflection', 'unlock', 'feed'));
alter table public.seed_ledger add constraint seed_ledger_amount_check
  check ((reason in ('unlock', 'feed')) = (amount < 0) and amount <> 0);

create or replace function public.spend_seeds(p_reason text, p_ref text, p_amount int) returns int
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  bal int;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_reason not in ('unlock', 'feed') then raise exception 'bad reason'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'bad amount'; end if;
  perform pg_advisory_xact_lock(hashtext(uid::text));  -- serialize this user's spends
  if not exists (select 1 from seed_ledger where user_id = uid and reason = p_reason and ref = p_ref) then
    select coalesce(sum(amount), 0) into bal from seed_ledger where user_id = uid;
    if bal < p_amount then raise exception 'not enough seeds'; end if;
    insert into seed_ledger (user_id, amount, reason, ref) values (uid, -p_amount, p_reason, p_ref);
  end if;
  return (select coalesce(sum(amount), 0) from seed_ledger where user_id = uid);
end $$;
-- Internal: clients must go through unlock_species (a direct call could pre-pay a cheaper amount).
revoke all on function public.spend_seeds(text, text, int) from public, anon, authenticated;

create or replace function public.unlock_species(p_species text) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  cost int := case p_species
    when 'sprout' then 0 when 'clover' then 30 when 'tulip' then 30
    when 'oak' then 60 when 'sunflower' then 60 when 'cherry' then 100 end;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if cost is null then raise exception 'unknown species'; end if;
  if cost = 0 or exists (select 1 from unlocked_species where user_id = uid and species = p_species) then
    return;
  end if;
  perform spend_seeds('unlock', p_species, cost);
  insert into unlocked_species (user_id, species) values (uid, p_species) on conflict do nothing;
end $$;
revoke all on function public.unlock_species(text) from public, anon;
grant execute on function public.unlock_species(text) to authenticated;

create or replace function public.check_species_unlocked() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.species <> 'sprout'
     and not exists (select 1 from unlocked_species where user_id = new.user_id and species = new.species) then
    raise exception 'species % is not unlocked', new.species;
  end if;
  return new;
end $$;
drop trigger if exists trg_species_unlocked on public.day_completions;
create trigger trg_species_unlocked before insert or update of species on public.day_completions
  for each row execute function public.check_species_unlocked();
