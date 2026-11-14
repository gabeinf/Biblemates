-- search_scripture: make the function inlinable so the HNSW index is used.
--
-- A `SET search_path` clause stops Postgres from inlining a SQL function, so the
-- body was planned without the actual arguments and fell back to computing the
-- distance to every embedding (~27k buffer reads per call, seconds whenever the
-- shared CPU is busy). Without the SET clause the function is inlined into the
-- caller's query and planned with real values (~1.7k buffer reads, ~15ms).
--
-- Every object is schema-qualified instead, which keeps it safe without
-- search_path (this is a SECURITY INVOKER function).

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
as $$
  with full_text as (
    select
      c.id,
      row_number() over (
        order by pg_catalog.ts_rank_cd(c.fts, pg_catalog.websearch_to_tsquery('english', query_text)) desc
      ) as rank_ix
    from public.scripture_chunks c
    where c.translation = p_translation
      and c.fts operator(pg_catalog.@@) pg_catalog.websearch_to_tsquery('english', query_text)
    order by rank_ix
    limit least(match_count, 50) * 2
  ),
  nearest as (
    -- ORDER BY distance + LIMIT is what the HNSW index can serve.
    select c.id, c.embedding operator(extensions.<=>) query_embedding as dist
    from public.scripture_chunks c
    where query_embedding is not null
      and c.translation = p_translation
    order by c.embedding operator(extensions.<=>) query_embedding
    limit least(match_count, 50) * 2
  ),
  semantic as (
    select n.id, row_number() over (order by n.dist) as rank_ix
    from nearest n
  )
  select
    c.id, c.translation, c.book_id, c.chapter, c.verse_start, c.verse_end, c.content,
    (
      coalesce(1.0 / (rrf_k + ft.rank_ix), 0.0) * full_text_weight +
      coalesce(1.0 / (rrf_k + s.rank_ix), 0.0) * semantic_weight
    )::float as score
  from full_text ft
  full outer join semantic s on ft.id = s.id
  join public.scripture_chunks c on c.id = coalesce(ft.id, s.id)
  order by score desc
  limit least(match_count, 50);
$$;

-- Make sure no SET clause survives from the previous definition.
alter function public.search_scripture(text, extensions.vector, int, text, float, float, int) reset all;
