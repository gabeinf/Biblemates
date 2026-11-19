---
name: fix-ci
description: Fix failing GitHub checks on the current branch's PR. Reads gh pr checks and the failed job logs, reproduces locally, fixes, re-runs pnpm verify, pushes, and re-checks. Use when CI or the verify check is red.
---

# Fix CI on the current PR

## 1. See what failed

```bash
gh pr checks                                  # which checks are red
gh run list --branch "$(git branch --show-current)" --limit 3
gh run view <run-id> --log-failed             # only the failing steps' logs
```

Find the first real error, not the cascade after it.

- **`guidelines` failures:** every line in the log ends with `| fix: <command>`. Read the `fix:` line and apply it; no guessing. After a PR-body fix the check reruns on its own (the workflow listens to `edited`).
- **Cancelled, timed-out or startup-failed job** (not a real failure): rerun only the failed job, never the whole pipeline: `gh run rerun <run-id> --failed`. The merge steward does this once per run; if the same check fails again, treat it as real.

## 2. Reproduce locally

Run the same step: `pnpm verify` (or a single step while iterating, e.g. `pnpm verify lint`).

If it passes locally but fails in CI, suspect environment differences: Node/pnpm version, missing Playwright browser, lockfile drift (`pnpm install --frozen-lockfile`), timezone, or env vars. Read `.github/workflows/verify.yml`.

## 3. Fix the cause

- Fix the code, not the check. Never skip or delete tests, add `eslint-disable`, add lint suppressions, or loosen the workflow just to get green. If one of those really is right, explain why in the PR.
- If the **same** error survives 3 attempts, stop and write up what you tried and what's blocking.

## 4. Push and re-check

```bash
pnpm verify                     # full run must pass before pushing
git add <files> && git commit -m "fix(ci): <what>"
git push origin HEAD
gh pr checks --watch
```

Report the final check status, plus what broke and what fixed it.

## 5. Record the lesson

If the failure was a new class (not already in `CLAUDE.md` → "Lessons"), append one dated line there: `- YYYY-MM-DD: <what to do, and why>`. Skip it for a repeat of a listed class.

If the same check still fails after 3 fix attempts, stop and report what you tried and what's blocking.
