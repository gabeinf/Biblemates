-- Study content. Safe to re-run: upserts by slug / (study_id, day_number).
-- Add new journeys here; circles pick them up from the Study tab.

insert into public.studies (slug, title, description, total_days) values
  ('faith-over-fear', 'Faith Over Fear', 'A 7-day journey through trusting God in uncertain seasons.', 7),
  ('abide', 'Abide', 'Seven days in John 15 and what it means to remain in Christ.', 7)
on conflict (slug) do update set title = excluded.title, description = excluded.description, total_days = excluded.total_days;

with s as (select id from public.studies where slug = 'faith-over-fear')
insert into public.study_days (study_id, day_number, title, book_id, chapter, verse_start, verse_end, read_minutes, question)
select s.id, d.day_number, d.title, d.book_id, d.chapter, d.verse_start, d.verse_end, d.read_minutes, d.question
from s, (values
  (1, 'Do Not Be Afraid',        'ISA', 41, 10, 13, 2, 'Where do you most need to hear "do not fear" this week?'),
  (2, 'The Lord Is My Shepherd', 'PSA', 23, 1,  6,  2, 'Which line of Psalm 23 feels most true for you right now — and which feels hardest to believe?'),
  (3, 'Do Not Worry',            'MAT', 6,  25, 34, 4, 'What are you holding onto that God is asking you to surrender?'),
  (4, 'Learning to Trust God',   'PRO', 3,  5,  6,  3, 'What''s one situation where you''re learning to trust God?'),
  (5, 'Peace That Guards',       'PHP', 4,  4,  9,  3, 'What would it look like to bring one specific worry to God in prayer today?'),
  (6, 'Perfect Love',            '1JN', 4,  16, 19, 3, 'How does knowing you are loved change the way you face fear?'),
  (7, 'Learning to Let Go',      'PSA', 46, 1,  11, 4, 'Looking back on this week, where have you seen God be your refuge?')
) as d(day_number, title, book_id, chapter, verse_start, verse_end, read_minutes, question)
on conflict (study_id, day_number) do update set
  title = excluded.title, book_id = excluded.book_id, chapter = excluded.chapter,
  verse_start = excluded.verse_start, verse_end = excluded.verse_end,
  read_minutes = excluded.read_minutes, question = excluded.question;

with s as (select id from public.studies where slug = 'abide')
insert into public.study_days (study_id, day_number, title, book_id, chapter, verse_start, verse_end, read_minutes, question)
select s.id, d.day_number, d.title, d.book_id, d.chapter, d.verse_start, d.verse_end, d.read_minutes, d.question
from s, (values
  (1, 'The True Vine',          'JHN', 15, 1,  4,  2, 'What does "pruning" look like in your life right now?'),
  (2, 'Apart From Me',          'JHN', 15, 5,  8,  2, 'Where are you trying to bear fruit on your own strength?'),
  (3, 'Abide in My Love',       'JHN', 15, 9,  11, 2, 'What helps you remain in God''s love on an ordinary day?'),
  (4, 'Love One Another',       'JHN', 15, 12, 17, 3, 'Who in your circle could you love more intentionally this week?'),
  (5, 'Chosen',                 'JHN', 15, 16, 17, 2, 'How does being chosen by Jesus shape how you see yourself?'),
  (6, 'When the World Pushes Back', 'JHN', 15, 18, 27, 3, 'Where have you felt resistance for following Jesus?'),
  (7, 'The Helper',             'JHN', 16, 7,  15, 3, 'Where do you need the Spirit''s guidance most this week?')
) as d(day_number, title, book_id, chapter, verse_start, verse_end, read_minutes, question)
on conflict (study_id, day_number) do update set
  title = excluded.title, book_id = excluded.book_id, chapter = excluded.chapter,
  verse_start = excluded.verse_start, verse_end = excluded.verse_end,
  read_minutes = excluded.read_minutes, question = excluded.question;

-- Backfill rows for users that signed up before this migration.
insert into public.profiles (id, display_name)
select id, coalesce(raw_user_meta_data ->> 'display_name', split_part(email, '@', 1)) from auth.users
on conflict (id) do nothing;
insert into public.notification_prefs (user_id) select id from auth.users on conflict do nothing;
