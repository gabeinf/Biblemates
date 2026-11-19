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
- One screen or one fix per PR. Size doesn't matter; testability does: any change under `apps/mobile/src/{app,components,lib,hooks,services}`
  or `packages/shared` must ship with a Jest test or an `e2e/*.spec.ts` change.
- Don't copy brand, copy or assets from `design/reference/`. Structure only, with original copy and visuals.
- Ask before adding a dependency. CI's `guidelines` check (`scripts/guidelines.mjs`) enforces the scriptable rules here
  (deps, suppressions, tests, PR body) labels passing PRs `gate:pass` and turns on auto-merge.
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

## Keyboard-aware layouts (required)

Applies to: any screen or sheet that contains a TextInput AND any bottom-anchored
element (footer button, CTA, toolbar, input bar, tab bar).

Requirements:

1. The footer must stay visible and tappable above the on-screen keyboard on BOTH
   iOS and Android. It must never be covered by or hidden behind the keyboard.
2. The footer must move with the keyboard frame by frame, using the keyboard's own
   timing. Don't snap it into place after the keyboard finishes opening.
3. The focused input must never be hidden behind the footer. Scrollable content
   must reserve space equal to the footer height plus spacing.
4. Safe area: when the keyboard is closed, the footer respects the bottom safe-area
   inset. When the keyboard is open, drop that inset so there's no gap.
5. Tapping the footer button while the keyboard is open must work on the first tap.
   Set keyboardShouldPersistTaps="handled" on scroll containers.
6. Keyboard height is NOT fixed while the keyboard is open. On iOS it changes
   when the QuickType/AutoFill suggestion bar appears or disappears (for example,
   when focus moves to a password or one-time-code field), when the user switches
   to the emoji or a third-party keyboard, and when an inputAccessoryView is
   present. The footer and scroll offset must react to every height change,
   not just to the keyboard opening and closing.

Implementation (use this, don't improvise):

- Use react-native-keyboard-controller. The app root is wrapped in <KeyboardProvider>.
- Footer: wrap it in <KeyboardStickyView offset={{ closed: 0, opened: insets.bottom }}>.
- Content: use <KeyboardAwareScrollView bottomOffset={footerHeight + 16}>.
- If you need custom animation, drive it from useReanimatedKeyboardAnimation()
  (or Reanimated's useAnimatedKeyboard) on the UI thread.

Never:

- Pin a footer with position: 'absolute', bottom: 0 without a keyboard offset.
- Animate from Keyboard.addListener + setState (it causes lag and a jump).
- Rely on KeyboardAvoidingView alone for a sticky footer (it behaves inconsistently
  on Android, especially with edge-to-edge layouts).
- Read the keyboard height once on show and store it in state or a constant.
- Hardcode a keyboard height or a "suggestion bar" offset.

Before you finish, check: "If the keyboard opens on this screen, where does the
footer go, and can I still see the focused input?" If you can't answer both,
the screen isn't done.
