-- Scripture retrieval for the AI chat (RAG).
--
-- scripture_chunks holds the Bible split into 3–5 verse passages. Each row has:
--   * embedding  – 1536-dim vector from OpenAI text-embedding-3-small (meaning search)
--   * fts        – generated tsvector (exact-word search, e.g. "mustard seed")
-- search_scripture() fuses both rankings with Reciprocal Rank Fusion. Passing a
-- NULL embedding gives keyword-only search, which doubles as the AI-down fallback.
--
-- Rows are written only by apps/server (service role). Clients may read.

create extension if not exists vector with schema extensions;

create table if not exists public.scripture_chunks (
  id uuid primary key default gen_random_uuid(),
  translation text not null,
  book_id text not null,            -- USFM code, e.g. 'PHP'
  chapter int not null,
  verse_start int not null,
  verse_end int not null,
  content text not null,            -- the passage text, verses joined with spaces
  embedding extensions.vector(1536),
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  created_at timestamptz not null default now(),
  constraint scripture_chunks_passage_key unique (translation, book_id, chapter, verse_start),
  check (verse_end >= verse_start)
);

-- Meaning search (cosine distance; text-embedding-3-small vectors are normalised).
create index if not exists scripture_chunks_embedding_idx
  on public.scripture_chunks using hnsw (embedding extensions.vector_cosine_ops);

-- Exact-word search.
create index if not exists scripture_chunks_fts_idx
  on public.scripture_chunks using gin (fts);

-- Direct reference lookups ("John 3:16") and citation checks.
create index if not exists scripture_chunks_ref_idx
  on public.scripture_chunks (translation, book_id, chapter, verse_start, verse_end);

alter table public.scripture_chunks enable row level security;
drop policy if exists bm_scripture_read on public.scripture_chunks;
create policy bm_scripture_read on public.scripture_chunks for select using (true);

-- Hybrid search: full-text + semantic, fused with Reciprocal Rank Fusion.
-- score = Σ weight / (rrf_k + rank) over the lists a chunk appears in.
create or replace function public.search_scripture(
  query_text text,
  query_embedding extensions.vector(1536) default null,
  match_count int default 10,
  p_translation text default 'web',
  full_text_weight float default 1.0,
  semantic_weight float default 1.0,
  rrf_k int default 50
)
returns table (
  id uuid,
  translation text,
  book_id text,
  chapter int,
  verse_start int,
  verse_end int,
  content text,
  score float
)
language sql stable
set search_path = public, extensions
as $$
  with full_text as (
    select
      c.id,
      row_number() over (order by ts_rank_cd(c.fts, websearch_to_tsquery('english', query_text)) desc) as rank_ix
    from scripture_chunks c
    where c.translation = p_translation
      and c.fts @@ websearch_to_tsquery('english', query_text)
    order by rank_ix
    limit least(match_count, 50) * 2
  ),
  semantic as (
    select
      c.id,
      row_number() over (order by c.embedding <=> query_embedding) as rank_ix
    from scripture_chunks c
    where query_embedding is not null
      and c.translation = p_translation
      and c.embedding is not null
    order by rank_ix
    limit least(match_count, 50) * 2
  )
  select
    c.id, c.translation, c.book_id, c.chapter, c.verse_start, c.verse_end, c.content,
    (
      coalesce(1.0 / (rrf_k + ft.rank_ix), 0.0) * full_text_weight +
      coalesce(1.0 / (rrf_k + s.rank_ix), 0.0) * semantic_weight
    )::float as score
  from full_text ft
  full outer join semantic s on ft.id = s.id
  join scripture_chunks c on c.id = coalesce(ft.id, s.id)
  order by score desc
  limit least(match_count, 50);
$$;
