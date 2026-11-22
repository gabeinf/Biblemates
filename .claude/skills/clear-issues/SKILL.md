---
name: clear-issues
description: Take a pile of tasks (or the open issues) from request to merged PRs with no hand-holding. Turns tasks into GitHub issues, keeps up to 3 worktree builders running from a rolling queue, relaunches as slots free up, and never merges. Use when asked to clear, triage, queue or work through tasks or open issues.
---

# Clear issues (coordinator)

Reads only GitHub and git state, never chat memory, so a fresh session resumes by re-running **Loop** from step 1. Keep your own context thin: builders return one line, details live in PR bodies, and `scripts/queue.mjs` replaces reading issue and PR bodies.

## Roles

| Role        | Who                       | Does                                                                  |
| ----------- | ------------------------- | --------------------------------------------------------------------- |
| Coordinator | this skill                | intake, launches builders, reports. Never edits code or merges        |
| Builder     | `/build-issue <N>` thread | one issue, one worktree, one PR, one-line reply                       |
| Reviewer    | `reviewer` subagent       | read-only review inside each builder's run                            |
| CI fixer    | `/fix-ci`                 | red PR checks, or a red master                                        |
| Steward     | CI (merge steward, #68)   | keeps PRs current and auto-merges once `verify` and `guidelines` pass |

## Shared surface

Issues touching any of these go in the serial lane (this is the one definition; other docs point here):

- `package.json`, `pnpm-lock.yaml`
- `packages/shared/**`
- `apps/mobile/src/app/(auth)/onboarding/_layout.tsx`
- `apps/mobile/src/lib/onboarding-flow.ts` (step order)
- `apps/mobile/src/theme/tokens.ts`
- `apps/mobile/eslint-suppressions.json`

## Intake (only when given tasks that aren't issues yet)

1. Split the pile into one task per screen or fix. Skip any whose title matches an open or recently closed issue.
2. Guess each task's files from the code map (`graphify-out/GRAPH_REPORT.md`; no repo-wide greps) and create the issue with `gh issue create --title "<type>(<area>): <task>" --body-file <file>`. Body template:

   ```markdown
   ## Goal

   One or two sentences.

   ## Files

   `path/one.tsx` `path/two.ts`

   ## Blocked by

   #N (omit this section if none)

   ## Acceptance

   - [ ] Checkable item. Every UI or logic change ships a Jest test or e2e spec.
   ```

3. Files go in backticks: `scripts/queue.mjs` reads them to avoid overlaps and to find the shared surface. Dependencies go in `Blocked by #N`.
4. A task that needs a new dependency or a product decision gets the label `needs-decision` (`gh label create needs-decision --force`). Don't ask about it now.
5. Print one table (issue, title, files, blocked by), then go straight to the Loop. Ask the user **once**, at the end, about every `needs-decision` issue together.

## Loop

1. `node scripts/queue.mjs` prints `master`, `launch`, `working`, `landing`, `hold` and `wait` lines. That's the whole plan; don't recompute it.
   - `master: unverified`: the script already dispatched a verify run. Treat it like `wait` (step 4).
   - `master: RED`: run `/fix-ci` on master first, then restart the loop.
   - `DONE`: print the final table (issue, state, PR URL) and stop.
2. For each issue in `launch`, in order: `gh label create in-progress --force --color FBCA04` then `gh issue edit <N> --add-label in-progress`. Then `delegate_task` with `isolation: "worktree"`, `role: "implementation"`, no `target` (inherit), and this `task`:

   ```text
   Run /build-issue <N> in your own worktree. Don't paste diffs, logs or screenshots into your final message:
   the PR body and CI artifacts hold the detail. If you hit the 3-attempt limit, stop and say why.
   Final reply is ONE line: `PR <full URL>, head <SHA>, verify <pass|fail>, blocked: <none|reason>`.
   ```

   The worktree starts from this checkout's commit, so `/build-issue` branches from `origin/master` itself (its step 2).

3. When a builder's reply names a PR, call `watch_pull_request` on it, then end your turn. Never poll. You wake on: a builder finishing, a PR check passing or failing, a conflict. On each wake:
   - red check or conflict: `/fix-ci` on that PR, or relaunch a builder from its branch. Don't wait for the user.
   - builder says `blocked`: `gh issue edit <N> --remove-label in-progress --add-label needs-decision`, comment the reason, move on.
   - otherwise: back to step 1.
4. Landing PRs hold their files until they merge, and a merge wakes nobody. If step 1 shows only `wait` or `landing` lines and nothing `working`, schedule one resume instead of ending silently: `schedule_task` with `schedule: {type: "once", runAt: <now + 10 min>}`, `bindToCurrentThread: true`, prompt `Run /clear-issues Loop from step 1.` Delete it (`delete_scheduled_task`) when you reach `DONE`.
5. After a `/clear` or crash: `working` lines with no PR may be dead builders. Check `t3_thread_list` for a live one; if none, remove the `in-progress` label and let step 1 relaunch it.

## Rules

- Never merge. The steward does it.
- A builder that hits the 3-attempt limit stops; report it and skip that issue, don't retry it.
- Never read a builder's diff or logs; read its PR only if a check is red.
- Rolling queue, not waves: at most 3 builders working at once, shared-surface issues one at a time, master verified green before each launch. `scripts/queue.mjs` enforces all three.
- The final report is the table only.
