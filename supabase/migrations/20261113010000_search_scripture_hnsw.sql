-- search_scripture: let the semantic half use the HNSW index.
--
-- The original ranked with row_number() over (order by distance), which forces a
-- sequential scan computing the distance to every embedding (~25k buffer reads).
-- Ordering by distance with a LIMIT inside a subquery lets Postgres walk the
-- HNSW index instead (~1k buffer reads), which matters most when the database's
-- shared CPU is busy. Same signature and results shape.

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
  nearest as (
    -- ORDER BY distance + LIMIT is what the HNSW index can serve.
    select c.id, c.embedding <=> query_embedding as dist
    from scripture_chunks c
    where query_embedding is not null
      and c.translation = p_translation
    order by c.embedding <=> query_embedding
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
  join scripture_chunks c on c.id = coalesce(ft.id, s.id)
  order by score desc
  limit least(match_count, 50);
$$;
