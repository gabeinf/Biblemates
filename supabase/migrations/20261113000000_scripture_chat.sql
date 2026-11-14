-- Scripture chat history.
-- apps/server writes these rows with the service role (after verifying the
-- user's JWT). Users can read and delete their own history from the app.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  title text check (char_length(title) <= 120),
  mood text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_user_recent on public.conversations (user_id, updated_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  -- Verified citations: [{translation, bookId, chapter, verseStart, verseEnd, reference, text}]
  citations jsonb not null default '[]'::jsonb,
  crisis boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_created on public.messages (conversation_id, created_at);

-- Keep conversations sorted by latest activity.
create or replace function public.touch_conversation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations set updated_at = now() where id = new.conversation_id;
  return new;
end $$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation after insert on public.messages
  for each row execute function public.touch_conversation();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists bm_conversations_read on public.conversations;
create policy bm_conversations_read on public.conversations for select using (user_id = auth.uid());
drop policy if exists bm_conversations_delete on public.conversations;
create policy bm_conversations_delete on public.conversations for delete using (user_id = auth.uid());

drop policy if exists bm_messages_read on public.messages;
create policy bm_messages_read on public.messages for select using (
  exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid())
);
