Biblemates

Proeject Desrcription:
An interactive shared bible across devices determined by the users selected bible, being able to add highlights,
notes, and reminders for the friends and family to stay connected through the word. Push notifications will allow for
nudging and continuing in the Word alongside live guided bible study presentation tools for hosts to walk others through
the text.

Codebase Approach:
A monorepo that holds both the app and the server to communicate live sessions and the app in the same place.

Technologies:
React Native, TypeScript, Zod, Socket.io, Reanimated, Azure

---------------------------------------------------------------------------------

Currently Working on:

What - v1 for TestFlight: circles, shared daily reading, Bible reader with highlights, 7-day group study, reflections, prayer, notifications

Why - Foundational piece to get users started

How - see "v1 architecture" below.

---------------------------------------------------------------------------------

## v1 architecture

```
apps/mobile/src
  app/
    (auth)/                 sign up / sign in / onboarding (unchanged)
    (main)/_layout.tsx      guard: no circle -> circle-setup, else tabs; push registration; realtime
    (main)/circle-setup     create a circle or join with a 6-char invite code
    (main)/(tabs)/home      shared reading, circle activity, group question, encouragement, prayer
    (main)/(tabs)/bible     reader: translations, chapter nav, reference search, highlights, bookmarks,
                            private notes, circle reflections per verse, "mark today read"
    (main)/(tabs)/study     7-day journey: Read -> Reflect -> Connect, reflection reveal
    (main)/reflect          modal: answer the day's question or reflect on a verse (private/circle)
    (main)/prayer           modal: new prayer request
    (main)/verse-reflections modal: circle reflections on one verse
    (main)/profile          opened from the avatar on Home: invite code, notification prefs, sign out
    (main)/edit-profile     modal: display name + profile picture (Supabase Storage `avatars` bucket)
  services/                 all Supabase + Bible API calls (one file per domain)
  hooks/queries.ts          React Query hooks + query keys; screens only use these
  lib/study-day.ts          "which day is it", progress maths
  constants/books.ts        66 books, reference parsing, chapter navigation
  types/db.ts               row types mirroring the SQL schema

supabase/
  migrations/               schema, RLS, triggers, RPCs (create_circle, join_circle, start_study…)
  seed.sql                  study content (Faith Over Fear, Abide) — add new journeys here
  functions/push            activity row -> Expo push (respects prefs + quiet hours)
  functions/daily-reminder  hourly cron; one reminder/day at the user's chosen local hour
  setup-notifications.sql   one-time trigger + cron wiring (fill in secrets, don't commit)
```

**How "alive" works:** every meaningful action (finished reading, shared reflection, prayer request,
encouragement, joined, milestone) is written to `activity` by a database trigger. The app listens to that
one table over Supabase Realtime, and the `push` function turns the same rows into notifications.

**Bible text:** `bible-api.com` (public-domain WEB/KJV/ASV/BBE/YLT, no key), cached on-device. To move to
ESV/NIV once licensed, replace `fetchFromProvider` in `services/bibleAPI.ts`.

**Scripture chat (`apps/server`):** Fastify + Socket.IO on your laptop for now (hosted before TestFlight).
The whole ASV is chunked (3–5 verses), embedded with OpenAI `text-embedding-3-small` and stored in
`scripture_chunks` (pgvector). `POST /search` runs the hybrid `search_scripture` function (semantic +
full-text, Reciprocal Rank Fusion) and falls back to keyword-only search if embedding takes over 10s.
Moods and request/response schemas live in `packages/shared/src/scripture.ts`. Supabase migrations own
the schema; Drizzle is only a typed query layer (`db:pull`). Secrets stay in `apps/server/.env`.

```sh
pnpm --filter @biblemates/server ingest         # embed the Bible (resumable, ~45 min cold)
pnpm --filter @biblemates/server run search "anxiety"
pnpm --filter @biblemates/server dev            # API on :3000, prints EXPO_PUBLIC_SERVER_URL for your phone
pnpm --filter @biblemates/server db:pull        # regenerate Drizzle types after a migration
```

## Setup

1. **Database**
   ```sh
   brew install supabase/tap/supabase
   supabase login && supabase link --project-ref <project-ref>
   supabase db push --include-seed
   ```
2. **Push notifications**
   ```sh
   supabase secrets set FUNCTION_SECRET=$(openssl rand -hex 32)
   supabase functions deploy push --no-verify-jwt
   supabase functions deploy daily-reminder --no-verify-jwt
   ```
   Then paste `supabase/setup-notifications.sql` into the SQL editor with your project ref + secret filled in.
3. **App env** — copy `apps/mobile/.env.example` to `.env.local` for local dev.

## Shipping to TestFlight

```sh
cd apps/mobile
# one time: make the env vars available to cloud builds (.env.local is not uploaded)
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value <url> --visibility plaintext
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value <key> --visibility plaintext

eas build -p ios --profile production      # creates certs + push key on first run
eas submit -p ios --latest                 # uploads to App Store Connect -> TestFlight
```

Push notifications only work on a physical device in a real build (not Expo Go / the simulator).
Build numbers auto-increment (`eas.json` → `appVersionSource: remote`).
