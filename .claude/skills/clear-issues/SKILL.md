---
name: clear-issues
description: Coordinate several GitHub issues in parallel. Lists open issues, drops ones merged or in flight, plans waves (shared-surface issues serial, the rest grouped by files), launches one worktree thread per issue running /build-issue, and never merges. Use when asked to clear, triage or work through open issues.
---

# Clear issues (coordinator)

Reads only GitHub and git state, never chat memory, so a fresh session can resume mid-wave: re-run from step 1.

## Roles

| Role        | Who                       | Does                                                              |
| ----------- | ------------------------- | ----------------------------------------------------------------- |
| Coordinator | this skill                | plans waves, launches builders, reports. Never edits code or merges |
| Builder     | `/build-issue <N>` thread | one issue, one worktree, one PR                                   |
| Reviewer    | `reviewer` subagent       | read-only review inside each builder's run                        |
| CI fixer    | `/fix-ci`                 | red PR checks, or a red master                                    |
| Steward     | CI (merge steward, #68)   | auto-merges PRs once `verify` and `guidelines` pass               |

## Shared surface

Issues touching any of these go in the serial lane (this is the one definition; other docs point here):

- `package.json`, `pnpm-lock.yaml`
- `packages/shared/**`
- `apps/mobile/src/app/(auth)/onboarding/_layout.tsx`
- `apps/mobile/src/lib/onboarding-flow.ts` (step order)
- `apps/mobile/src/theme/tokens.ts`
- `apps/mobile/eslint-suppressions.json`

## 1. Read state

```bash
gh issue list --state open --json number,title,body,labels
gh pr list --state all --json number,title,headRefName,body,state     # `Closes #N` = merged or in flight
git fetch origin && git worktree list                                # worktrees already on an issue
gh run list --workflow verify --branch master --limit 1 --json headSha,conclusion,status   # master green? (see below)
```

Drop an issue if a PR (open or merged) closes it, or a worktree/branch is already on it. Ask before taking one that's ambiguous or needs a new dependency.

## 2. Plan waves

- Guess each issue's files from its body and the code map (`graphify-out/GRAPH_REPORT.md`).
- Issue touches the **shared surface** → serial lane: one at a time, each waits for the previous PR to merge.
- Others: group by files touched; issues that overlap on any file go in different waves.
- A wave is at most **3** builders. Print the plan (wave → issue → files) before launching.

## 3. Launch a wave

- **Master green** = the latest `verify` run on master has `conclusion: success` and its `headSha` equals `git rev-parse origin/master`. Auto-merges fire no push run (see `verify.yml`), so after merges a SHA mismatch or in-progress run means unverified: wait for the hourly run. Red: launch `/fix-ci` on master first and wait.
- One worktree thread per issue, from `origin/master`, running `/build-issue <N>`. Never launch two on the same file.
- Don't poll builders. Next wave starts when the previous wave's PRs have merged (`gh pr list --state merged`) and master is green again (same check).

## Rules

- Never merge. The steward does it.
- A builder that hits the 3-attempt limit stops; report it and skip that issue, don't retry it.
- End each pass with a table: issue, state (merged / PR url / blocked / queued), wave.
