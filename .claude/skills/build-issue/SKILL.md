---
name: build-issue
description: Build one GitHub issue end to end. Reads the issue, branches, implements, runs pnpm verify, runs the design-check and reviewer subagents, fixes until clean, then opens a PR from the template with screenshots. Use when asked to build, implement or work on issue #N.
argument-hint: '[issue-number]'
---

# Build issue #$ARGUMENTS

Follow these steps in order. Don't skip any.

## 1. Understand

- `gh issue view $ARGUMENTS`: read the body and acceptance checklist.
- Read the matching section of `docs/specs/onboarding.md`.
- Don't open the reference PNGs yourself. Run the **design-check** subagent with `describe <NN>` and build from the text outline it returns. Images stay in the subagent's context instead of riding along on every later turn of this one.
- Re-read the **Lessons** in `CLAUDE.md`.
- If the issue is ambiguous or seems to need a new dependency, ask before writing code.

## 2. Branch

```bash
git switch master && git pull --ff-only
git switch -c feat/onboarding-<n>-<short-slug>   # or fix/<slug>
```

Never work on `master`. One issue = one branch = one PR.

## 3. Build

- One screen or one fix per PR. Size is not limited, but every UI or logic change needs a Jest test or e2e spec so CI can measure it.
- Each step lives at its own route: `apps/mobile/src/app/(auth)/onboarding/<n>.tsx` → `/onboarding/<n>`. The `(auth)` group keeps it behind the signed-out guard.
- Reuse components in `apps/mobile/src/components/` and tokens in `apps/mobile/src/theme/`.
- Write original copy and visuals. Copy structure only from the reference, never its brand, wording or art.
- Add or extend Jest tests for any logic (answer state, persistence, navigation helpers).

## 4. Verify

```bash
pnpm verify
```

All four steps must pass. If one fails, fix it and re-run. If the **same** error survives 3 attempts, stop and explain what's blocking instead of looping.

## 5. Check

Run both subagents (in parallel), passing the issue number and step number:

- **design-check**: on `artifacts/screenshots/onboarding-<NN>.png` vs. the reference.
- **reviewer**: on the branch diff.

Fix every FAIL and BLOCKING item, then go back to step 4. Repeat until verify passes, design-check says `OVERALL: PASS`, and reviewer says `VERDICT: PASS`.

## 6. Open the PR

```bash
git push -u origin HEAD
gh pr create --base master --title "<type>(onboarding): <summary>" --body-file <filled template>
```

Fill every section of `.github/pull_request_template.md`:

- `Closes #$ARGUMENTS`
- Mark each spec checklist item ✅/❌ using the design-check result.
- **Screenshots:** CI uploads `artifacts/screenshots/` as the `screenshots` build artifact. Link the workflow run and name the files; reference images are in `design/reference/onboarding/`.
- **How verified:** leave the template line; CI `verify` is the proof.

Finish by giving the PR URL and the final verify summary.
