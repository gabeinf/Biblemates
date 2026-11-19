# Biblemates: rules for every Claude session

@AGENTS.md

## Stack

- pnpm 12 monorepo: `apps/mobile` (Expo SDK 58, expo-router, React Native 0.88, React 19, TypeScript),
  `apps/server` (Fastify + Socket.IO scripture chat), `packages/shared` (Zod schemas), `supabase/`.
- Data: Supabase via `apps/mobile/src/services/*`; screens use React Query hooks in `hooks/queries.ts`.
- Tests: Jest (`jest-expo`) + React Native Testing Library, colocated as `*.test.ts(x)`.
  Import `describe`/`it`/`expect` from `@jest/globals` (no global test types).
- Lint/format: ESLint (`eslint-config-expo`), Prettier (single quotes, no semicolons).
- Screenshots: Playwright against the static web export (`e2e/screens.spec.ts`).
- Architecture details: see `README.md` → "v1 architecture".

## Where things go

```
apps/mobile/src/app/(auth)/onboarding/<n>.tsx   onboarding step n → URL /onboarding/<n>
apps/mobile/src/components/                     shared UI (reuse before adding)
apps/mobile/src/theme/tokens.ts                 colors, spacing, type: no hard-coded values
docs/specs/onboarding.md                        what "done" means for each screen
design/reference/onboarding/NN-*.png            reference screens (structure only)
scripts/                                        verify pipeline + Claude hooks
```

## Running

```sh
pnpm install
pnpm web            # app in the browser
pnpm mobile         # Expo dev server (iOS/Android)
pnpm verify         # typecheck → lint → test → screenshots (the definition of done)
pnpm verify lint    # run one step while iterating (doesn't count as done)
```

Screenshots land in `artifacts/screenshots/` (gitignored).

Code map: `graphify update .` rebuilds `graphify-out/` (local AST, no tokens, gitignored).
For "where is / what calls / how does X connect" questions, read `graphify-out/GRAPH_REPORT.md`
or run `graphify explain "<symbol>"` before grepping or opening whole files.

## Workflow rules

- Never commit to `master`. One issue = one branch = one PR. Branches: `feat/…`, `fix/…`, `chore/…`.
- Push with an explicit branch (`git push -u origin HEAD`), never bare `git push`. Never force-push. Claude never merges PRs: CI's auto-merge does it once `verify` and `guidelines` pass.
- Before saying a task is done, run `pnpm verify` and show its output. A Stop hook enforces this.
- Keep PRs small: one screen or one fix each. If a change grows past ~300 lines, split it and say so.
- Don't copy brand, copy or assets from `design/reference/`. Structure only, with original copy and visuals.
- Ask before adding a dependency. CI's `guidelines` check (`scripts/guidelines.mjs`) enforces the scriptable rules here
  (size, deps, suppressions, tests, PR body) labels passing PRs `gate:pass` and turns on auto-merge.
- Keep images out of the main session: don't `Read` PNGs from `design/reference/` or `artifacts/screenshots/`.
  Use the `design-check` subagent (`describe <NN>` for a layout outline, or a normal check for pass/fail).
- If the same error survives 3 attempts, stop and explain instead of looping.
- Fix causes, not checks: no skipped tests, `eslint-disable`, or new lint suppressions to get green.
- Don't read `.env*` files. Public config comes from `EXPO_PUBLIC_*` vars, and verify uses placeholders.

## Lint baseline

`apps/mobile/eslint-suppressions.json` holds lint errors that existed before linting was adopted.
New errors fail verify. When you fix suppressed errors in a file you're touching, run
`pnpm --dir apps/mobile exec eslint . --prune-suppressions` so the baseline shrinks. Never add to it.

## Lessons

<!-- When the human corrects a repeated mistake, add a one-line rule here: what to do, and why. -->

- (none yet)
