# STATE (rewrite at the end of every session; ≤80 lines)

## Phase (2026-11-20)
S0 done. S1 merged (#103). S2 shipped as PRs, S3 partly (automated checks only). **S4 (Rive) NOT started**: no `biblemates.riv` exists yet (`~/Documents/BibleMates-Rive` has only `.rml` sources, no build output) and the session is gated on verified animations.

## PRs (each = 1 issue = 1 branch, auto-merged by CI once verify + guidelines pass)
| PR | what | state when written |
|---|---|---|
| #103 | S1 theme kit | merged |
| #105 | batch 1: Intro (step 1), chunky Button, Today | open (verify running) |
| next | batch 2: front lamb slot on onboarding 6, 7, 9, 15, 16, 17 | local branch `feat/onboarding-lamb-slots` |
| next | batch 3: check-in / study-complete celebrations, nudge sheet | local branch `feat/celebrations` |
| next | batch 4: lamb on Study empty + circle setup, Dynamic Type cap on pills, QA notes | local branch `feat/empty-states-a11y` |
Rebase each onto master after its parent merges, push under a NEW branch name if already pushed (never force-push).

## Stack facts
Expo SDK 58 (CNG), RN 0.88, expo-router 58, native tabs, Reanimated 4, expo-haptics present. Theme in `apps/mobile/src/theme/` (`active.ts` = the palette switch). Legacy `colors.*` derive from the active palette; new code uses `useTheme()` + `components/ui`.

## Decisions (defaults taken because Q1-Q5 were not answered individually; Gabe said "work through everything")
1. Streak is derived client-side (current study only); no seeds, no Shop, no seed pill/tile.
2. Flock = one lamb per circle member (PastureView `lambCount`). Intro line re-written to "Read with friends and your flock grows." (placeholder only; the Rive Intro bakes its copy, so the design agent must re-bake it).
3. Tab bar untouched (native, "Home" label kept). Renaming to "Today" NOT done (Q3 open).
4. No new dependencies (expo-haptics was already on master). Rive runtime still needs approval.
5. Home CTA label stays "Continue reading": check-in actually happens in the Bible tab.
6. Unbuilt `[step]` placeholder was removed on master; all onboarding steps now exist.

## Known gaps / not done
- No iOS simulator screenshots (web-export screenshots + `/_design` only). Device checks pending: VoiceOver, Dynamic Type 200%, Reduce Motion, iPhone SE layout, haptics.
- Palette-swap QA: contrast + role tests only; a visual ACTIVE_PALETTE swap on device is not done.
- Onboarding 13 (Name) has no lamb (keyboard layout); chat empty state, prayer empty state, missed-day "kind" state and the separate "streak extended" screen are not built.
- Raw spacing numbers are not linted.
- Handoff lamb/seed PNGs are opaque; keyed out locally (see ASSET_REQUEST P0).
- Native splash is navy but the old yellow `splash-icon.png` is still the splash image (Rive Intro replaces it in S4).
- Time of day: golden hour only (night/morning palettes not designed).

## Open questions for Gabe
- Q1 seeds/streak mechanic (default applied above), Q2 flock meaning (default applied), Q3 rename Home to Today, Q4 approve the Rive runtime dependency for S4.

## Next
1. Merge PRs in order (#105, then the three local branches as they are pushed).
2. Send ASSET_REQUEST.md to the design agent; when `biblemates.riv` exists, run S4.

## Batch 4 (#108) shipping notes
- Rebased onto origin/master after #109/#110 merged; verify green (typecheck, lint, style, contrast, test, screenshots).
- Reviewer: PASS. Non-blocking: no Jest test for the Study lamb (covered by circle-setup + Pill tests); ASSET_REQUEST.md unchanged (nothing new needed).

## fix/celebrations-gaps (follow-up to #110)
- Gap 1+3: `lib/celebrations.ts` `showCelebration(router, kind)` is the only way to open /celebrate (Bible check-in, layout milestone). One screen max; study replaces an open check-in (router.replace); a check-in arriving after study is dropped; duplicates ignored. Celebrate screen calls `celebrationClosed(kind)` on unmount (only clears if it is still the current kind).
- Gap 2: NudgeSheet keeps the last non-null name in state (set during render), no ref.
- Tests: lib/celebrations.test.ts, celebrate.test.tsx (NudgeSheet slide-out name; Modal mocked to stay mounted).
- Limit: a study milestone arriving after the check-in screen was already dismissed still shows (sequential, not stacked).

## fix/empty-states-gaps (follow-up to #111)
- Added `__tests__/study.test.tsx`: lamb + copy for no-study and completed states, no lamb while a study is active.
- ASSET_REQUEST.md: added the "Placeholder slots shipped in #111" swap list (Study idle/happy, circle-setup wave) and the single "A lamb" a11y label rule. `.rework/` is tracked in git, so it ships in the PR.

## 13 lamb (feat/onboarding-13-lamb)
- Lamb = LambView front (MASCOT size) in the head block. Collapses (height + opacity) via useReanimatedKeyboardAnimation().progress on the UI thread. Autofocus means it is mostly hidden while typing; it returns when the keyboard is dismissed. No new assets.

## feat/chat-prayer-empty-states
- Chat: lamb (120pt) above the welcome, collapses with the keyboard via `useReanimatedKeyboardAnimation` (same as onboarding 13). Chat's existing KeyboardAvoidingView layout left alone (out of scope).
- Chat history: `EmptyState` replaces the muted line.
- Prayer: `(main)/prayer.tsx` is a composer form, and lambs never go in forms, so no lamb there. The "no open requests" empty state lives in the Today prayer list (`(tabs)/home.tsx`), which got the 96pt lamb.
- All slots are static front lamb; poses listed in ASSET_REQUEST.md. Tests: `__tests__/chat-empty.test.tsx`, `today.test.tsx`.

## feat/missed-day-state (presentation only)
- Derived from existing `day_completions`: `lib/missed-day.ts` `slippedYesterday` (yesterday unread and today unread, day > 1). No schema, service, streak rule or grace-day change.
- Today: "Welcome back" banner (sitting-lamb slot = static side lamb, see ASSET_REQUEST), CTA label "Read now". StreakWeek gets a soft `missed` dot (sunken fill, no alarm colour). Copy has no shame words, no Scripture.
- Contrast guard gained textSecondary on surfaceSunken.
- Not done: per-member "missed" styling in the circle row (would imply showing others' lapses; product call).
