---
name: build-issue
description: Build one GitHub issue end to end. Reads the issue, branches, implements, runs pnpm verify, runs the design-check and reviewer subagents, fixes until clean, then opens a PR from the template with screenshots. Use when asked to build, implement or work on issue #N.
argument-hint: '[issue-number]'
---

# Build issue #$ARGUMENTS

Follow these steps in order. Don't skip any.

## 1. Understand

- No issue number (a chore or fix with no issue)? Create one first: `gh issue create --title "<title>" --body "<why>"`, and use its number as `#N` everywhere below. The PR body needs `Closes #N` or the `guidelines` gate fails.
- `gh issue view $ARGUMENTS`: read the body and acceptance checklist.
- Read only your screen's section plus "Shared rules", never the whole 480-line spec:
  `sed -n '/^## Shared rules/,/^## 01 /p;/^## <NN> /,/^## <NN+1> /p' docs/specs/onboarding.md`
- Don't open the reference PNGs yourself. Run the **design-check** subagent with `describe <NN>` and build from the text outline it returns. Images stay in the subagent's context instead of riding along on every later turn of this one.
- Re-read the **Lessons** in `CLAUDE.md`.
- If the issue is ambiguous or seems to need a new dependency, ask before writing code.

## 2. Branch

```bash
git fetch origin && git switch -c feat/onboarding-<n>-<short-slug> --no-track origin/master   # or fix/<slug>
```

In a worktree you can't `switch master` (another checkout owns it), so branch from `origin/master`.
Reference PNGs are gitignored and missing in a fresh worktree: copy only the ones you need from the
main checkout (first line of `git worktree list`) into `design/reference/onboarding/`.

Never work on `master`. One issue = one branch = one PR.

## 3. Build

- Edit only the issue's own files. If you need a file on the shared surface (see `clear-issues`) that the issue doesn't name, stop and say so.
- One screen or one fix per PR. Size is not limited, but every UI or logic change needs a Jest test or e2e spec so CI can measure it.
- Each step lives at its own route: `apps/mobile/src/app/(auth)/onboarding/<n>.tsx` → `/onboarding/<n>`. The `(auth)` group keeps it behind the signed-out guard.
- Reuse components in `apps/mobile/src/components/` and tokens in `apps/mobile/src/theme/`.
- Write original copy and visuals. Copy structure only from the reference, never its brand, wording or art.
- Add or extend Jest tests for any logic (answer state, persistence, navigation helpers).

## 4. Verify

```bash
pnpm verify
```

All four steps must pass. If one fails, fix it and re-run only that step (`pnpm verify lint`, `pnpm verify test`…), then run the full `pnpm verify` once at the end. If the **same** error survives 3 attempts, stop and explain what's blocking instead of looping.

## 5. Check

**Round 1:** run **design-check** (on `artifacts/screenshots/onboarding-<NN>.png`) and **reviewer** (on `git diff origin/master...HEAD`) in parallel, passing the issue and step numbers.

**Round 2 (only if round 1 had a FAIL or BLOCKING item):** fix, re-run `pnpm verify`, then re-run **only the agent that failed**. Tell it the previous findings and give it just the fix: `git diff HEAD` before you commit it, or `git diff <round-1-sha>..HEAD`. It checks that each finding is resolved and that the fix broke nothing nearby. Don't re-run an agent that already passed, and don't re-review the whole branch.

**Stop after round 2.** If anything is still failing, stop and report it instead of starting round 3.

Print one line per round so the loop is auditable: `Round N: <agent(s)> on <diff range> → PASS|FAIL (<n> findings)`.

## 6. Open the PR

```bash
git push -u origin HEAD
gh pr create --base master --title "<type>(onboarding): <summary>" --body-file <filled template>
```

Fill every section of `.github/pull_request_template.md`:

- `Closes #$ARGUMENTS` (required; the gate checks it)
- Mark each spec checklist item ✅/❌ using the design-check result.
- **Screenshots:** CI uploads `artifacts/screenshots/` as the `screenshots` build artifact. Link the workflow run and name the files; reference images are in `design/reference/onboarding/`.
- **How verified:** leave the template line; CI `verify` is the proof.

## 7. Watch it

Right after opening the PR, call `watch_pull_request` on it. If a check goes red, run `/fix-ci` yourself; don't wait for the user to ask. Never merge: CI's auto-merge does it. Give the PR URL and the final verify summary.
