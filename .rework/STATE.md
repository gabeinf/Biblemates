# STATE (rewrite at the end of every session; ≤80 lines)

## Phase

S0 done. **S1 built on `feat/theme-kit` (PR pending).** Gabe said "work through everything": Q1-Q5 taken at the recommended defaults (see Decisions). Next = S2 batch 1 after S1 merges.

## Stack facts

- **Expo SDK 58 (managed + CNG)**, not bare RN. RN 0.88.1, React 19.3, expo-router 58, native tabs (system bar), pnpm monorepo.
- Install with `pnpm --filter @biblemates/mobile add …` / `npx expo install …` + `npx expo prebuild`/dev build (never `yarn`/`pod install` by hand). Rive and any native lib need a dev build.
- No Nunito, expo-haptics, react-native-svg or Rive installed. Fonts today: Cormorant + Lora. Theme in `apps/mobile/src/theme/tokens.ts` (hex in one file already).
- Definition of done in this repo = `pnpm verify` (typecheck, lint, test, screenshots on web export). One issue = one branch = one PR, never commit to master, ask before adding deps (CLAUDE.md).
- Files: `.rework/APP_BRIEF.md` (facts), `REWORK_PLAN.md` (screens/batches), `ASSET_REQUEST.md` (send to design agent now).

## Decisions made (log)

1. Keep native tab bar, tint meadow. No custom pill tab bar.
2. Keep 3 tabs (Home→Today?, Bible, Study); no Shop/Friends/Flock tab.
3. Nunito 600 + 800 only (700 not supplied). Nunito also for Bible reader text.
4. Onboarding step ids/flow unchanged; "Meet your first lamb" lives inside the Rive `Intro` at step 1.
5. Old `colors.*` keys get codemodded to semantic names in S1 (mapping in REWORK_PLAN).
6. Flock = one lamb per circle member (proposal, see Q2). Whole-group banner and new-lamb come from real activity events.
7. Seeds pill, streak pill, Seeds tile, Shop hidden until Q1 answered.
8. Web (Playwright) gets a static lamb/pasture fallback, since Rive RN is native-only.
9. Unbuilt onboarding screens (8, 14, 16, join) not built here.

## Open questions for Gabe (all are new mechanics or renames)

- **Q1 Seeds/streaks**: neither exists. Options: (a) **recommended** show a client-derived streak (from `day_completions`), no seeds/shop; (b) build seeds + streak tables (schema + server); (c) neither. Default if no answer = (a).
- **Q2 Flock meaning**: (a) **recommended** each circle member is a lamb, new lamb when a friend joins; (b) earned lambs per N check-ins (new mechanic). Intro copy needs a re-bake under (a).
- **Q3** Rename tab "Home" → "Today"?
- **Q4 Dependencies** to approve (CLAUDE.md): `expo-haptics` (S2), Rive RN runtime (S4), `react-native-svg` only if needed.
- **Q5 Queue**: pause the `/clear-issues` builders and land the uncommitted edits (onboarding 2, 12, _layout) before S1?

## Blockers / risks

See REWORK_PLAN.md "Risks". Top 3: queue collision, Rive on web verify, deps/native rebuild.

## Next (superseded by S1 result)

Gabe: approve plan + answer Q1–Q5, send `ASSET_REQUEST.md` to the design agent. Then new chat: `Read ~/Documents/BibleMates-Rive/handoff/t3/S1-theme-kit.md and do exactly that session. Repo root = current directory.`

## S1 result (2026-11-20)
- `theme/`: `palettes/{goldenHour,testInverted,types}.ts` (identical keys enforced by `Palette`), `semantic.ts` (`makeTheme`), `active.ts` (ACTIVE_PALETTE = the switch), `system.ts` (type/space/radius/control/motion/pasture), `index.tsx` (`ThemeProvider`, `useTheme`). Legacy `colors.*` in `tokens.ts` now derives from the active palette, so every existing screen already re-themed (Gold→meadow primary). Screens migrate to `useTheme()` per S2 batch.
- Kit in `components/ui/` (barrel `index.ts`); old `ui.tsx` moved to `ui/legacy.tsx`, re-exported. Placeholders: LambView, PastureView, SeedIcon, IntroView.
- Guards: `pnpm contrast` + Jest contrast test, `pnpm style` (hex/rgba/fontFamily outside theme/), both inside `pnpm verify`.
- Fonts: Nunito 600/800 bundled, Cormorant/Lora removed. Italic call sites render upright.
- Dev gallery: `/_design` (dev only, `__DEV__`).
- Jest: reanimated stub in `jest.setup.ts` (its own mock needs the worklets native module).
- **Asset issue**: handoff character/seed PNGs are NOT transparent (opaque #1D1D1D bg). Keyed out locally with a flood fill for placeholders. Ask design agent for true alpha PNGs.
- Not done: raw-spacing-number lint (no reliable grep), iOS simulator screenshots (web screenshot of `/_design` checked instead), haptic lib already present (`expo-haptics`).
