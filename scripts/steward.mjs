// Merge steward: with "require up to date" on, merge PRs one at a time, each verified against the
// real master. Needs MERGE_BOT_TOKEN (a PAT/App token): pushes made with GITHUB_TOKEN fire no
// workflows, so `gh pr update-branch` would never re-run verify. No token → notice and exit 0.
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const FAILED = ['FAILURE', 'TIMED_OUT', 'CANCELLED', 'STARTUP_FAILURE', 'ERROR']
// gh's rollup keeps superseded runs (a CANCELLED run then its rerun), so judge only the latest per check.
const latestChecks = (pr) => {
  const latest = new Map()
  for (const c of pr.statusCheckRollup ?? []) {
    const key = c.name ?? c.context
    const at = (x) => x.startedAt || x.completedAt || '\uffff' // not started yet = newest
    if (!latest.has(key) || at(c) >= at(latest.get(key))) latest.set(key, c)
  }
  return [...latest.values()]
}
const failed = (pr) => latestChecks(pr).some((c) => FAILED.includes(c.conclusion ?? c.state))

// Infra flakes (not a real failure of the code): worth one rerun of just the failed job.
const FLAKY = ['CANCELLED', 'TIMED_OUT', 'STARTUP_FAILURE']
// Run ids of this PR's latest-per-check flakes. Status contexts have no run id in detailsUrl: skipped.
export function flakyRuns(pr) {
  const ids = latestChecks(pr)
    .filter((c) => FLAKY.includes(c.conclusion))
    .map((c) => /\/actions\/runs\/(\d+)/.exec(c.detailsUrl ?? '')?.[1])
  return [...new Set(ids.filter(Boolean))]
}

// pr: gh `pr list --json` shape. Returns { action: 'update' | 'none', pr?, reason }.
export function pick(prs, masterRed) {
  if (masterRed) return { action: 'none', reason: 'master verify is red' }
  const ready = prs
    .filter(
      (p) =>
        !p.isDraft &&
        p.autoMergeRequest &&
        p.labels.some((l) => l.name === 'gate:pass') &&
        p.mergeStateStatus !== 'DIRTY' && // conflicts: a human has to fix it, don't let it block the queue
        !failed(p),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.number - b.number)
  if (!ready.length) return { action: 'none', reason: 'no ready PRs' }
  // A PR that isn't behind is already current: it merges itself once green. Never start a second.
  // shortcut: a current PR stuck green but unmerged blocks the queue, add a timeout if it happens.
  const inFlight = ready.find((p) => p.mergeStateStatus !== 'BEHIND')
  if (inFlight)
    return { action: 'none', reason: `#${inFlight.number} is already updating or merging` }
  return {
    action: 'update',
    pr: ready[0],
    reason: `#${ready[0].number} is oldest and behind master`,
  }
}

const gh = (...a) => execFileSync('gh', a, { encoding: 'utf8' })
const json = (...a) => JSON.parse(gh(...a))

function main() {
  if (!process.env.GH_TOKEN) {
    console.log('::notice::MERGE_BOT_TOKEN is not set; steward is a no-op until it is.')
    return
  }
  const [run] = json(
    'run',
    'list',
    '--workflow',
    'verify.yml',
    '--branch',
    'master',
    '--status',
    'completed',
    '--limit',
    '1',
    '--json',
    'conclusion',
  )
  const masterRed = ['failure', 'timed_out'].includes(run?.conclusion)

  const open = json('issue', 'list', '--label', 'master-red', '--state', 'open', '--json', 'number')
  if (masterRed && !open.length) {
    gh(
      'label',
      'create',
      'master-red',
      '--force', // label survives a previous red; plain create would throw
      '--color',
      'B60205',
      '--description',
      'master verify is failing',
    )
    gh(
      'issue',
      'create',
      '--label',
      'master-red',
      '--title',
      'master is red: merges paused',
      '--body',
      'The latest completed `verify` run on master failed. The merge steward pauses until it is green.',
    )
  } else if (!masterRed && open.length) {
    for (const i of open)
      gh('issue', 'close', String(i.number), '--comment', 'master verify is green again.')
  }

  const prs = json(
    'pr',
    'list',
    '--state',
    'open',
    '--limit',
    '200',
    '--json',
    'number,isDraft,labels,autoMergeRequest,mergeStateStatus,createdAt,statusCheckRollup',
  )
  // One rerun per run: attempt > 1 means it was already rerun, so a second failure is left for /fix-ci.
  for (const id of new Set(prs.flatMap(flakyRuns))) {
    try {
      if (json('run', 'view', id, '--json', 'attempt').attempt > 1) continue
      gh('run', 'rerun', id, '--failed')
      console.log(`steward: reran failed jobs of run ${id}`)
    } catch (e) {
      console.log(
        `steward: could not rerun run ${id}: ${(e.stderr || e.message).toString().trim().split('\n')[0]}`,
      ) // e.g. run still in progress
    }
  }
  const r = pick(prs, masterRed)
  console.log(`steward: ${r.action}: ${r.reason}`)
  if (r.action === 'update') gh('pr', 'update-branch', String(r.pr.number))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
