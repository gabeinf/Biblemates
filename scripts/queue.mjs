// Coordinator queue: reads GitHub once and prints which issues to launch next, in ~10 lines.
// The /clear-issues coordinator runs this instead of dumping issue and PR bodies into its context.
//   node scripts/queue.mjs            → plan; dispatches a master verify if master is unverified
// Issue body conventions (written by the coordinator's intake step):
//   `path` in backticks = files the issue touches   ·   "Blocked by #N"   ·   label needs-decision
// Claimed = label `in-progress` (set by the coordinator at launch) or an open PR with `Closes #N`.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { sharedMatcher } from './guidelines.mjs'

export const MAX_BUILDERS = 3
const DONE = ['SUCCESS', 'SKIPPED', 'NEUTRAL']

const norm = (p) => p.replace(/\/\*\*?$/, '').replace(/\/$/, '')
// '*' = files unknown: overlaps everything, so the issue runs alone.
const touches = (a, b) =>
  a === '*' || b === '*' || a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`)
const overlap = (as, bs) => as.some((a) => bs.some((b) => touches(a, b)))

export function parseIssue(i, isShared) {
  const body = i.body ?? ''
  const files = [...body.matchAll(/`([^`\s]+\/[^`\s]*|[^`\s/]+\.[a-z]{1,5})`/g)].map((m) =>
    norm(m[1]),
  )
  return {
    number: i.number,
    title: i.title,
    files: files.length ? files : ['*'],
    shared: files.some(isShared),
    deps: [...body.matchAll(/(?:blocked by|depends on)\s+#(\d+)/gi)].map((m) => Number(m[1])),
    hold: i.labels.some((l) => l.name === 'needs-decision'),
    claimed: i.labels.some((l) => l.name === 'in-progress'),
  }
}

// PR → { closes: issue number | null, landing: green and set to auto-merge }
export function parsePr(p) {
  const rolled = p.statusCheckRollup ?? []
  return {
    closes: Number(/closes\s+#(\d+)/i.exec(p.body ?? '')?.[1]) || null,
    landing:
      !p.isDraft &&
      Boolean(p.autoMergeRequest) &&
      p.labels.some((l) => l.name === 'gate:pass') &&
      rolled.length > 0 &&
      rolled.every((c) => DONE.includes(c.conclusion)),
  }
}

// issues/prs: gh --json shapes. Returns what to launch, and why anything else waits.
export function plan({ issues, prs, masterGreen, isShared, max = MAX_BUILDERS }) {
  const all = issues.map((i) => parseIssue(i, isShared))
  const open = new Set(all.map((i) => i.number))
  const pr = prs.map(parsePr)
  const prIssues = new Set(pr.map((p) => p.closes))
  const landing = new Set(pr.filter((p) => p.landing).map((p) => p.closes))

  const held = all.filter((i) => i.claimed || prIssues.has(i.number)) // its files are spoken for
  const working = held.filter((i) => !landing.has(i.number))
  const out = {
    launch: [],
    working,
    landing: held.filter((i) => landing.has(i.number)),
    wait: [],
    hold: [],
  }
  let slots = max - working.length

  for (const c of all.filter((i) => !held.includes(i))) {
    if (c.hold) out.hold.push(c)
    else {
      const open_deps = c.deps.filter((d) => open.has(d))
      const clash = held.concat(out.launch).find((h) => overlap(c.files, h.files))
      const why = !masterGreen
        ? 'master not verified green'
        : open_deps.length
          ? `blocked by #${open_deps.join(', #')}`
          : clash
            ? `overlaps #${clash.number}`
            : c.shared && held.concat(out.launch).some((h) => h.shared)
              ? 'shared surface: one at a time'
              : slots <= 0
                ? `all ${max} builder slots busy`
                : ''
      if (why) out.wait.push({ ...c, why })
      else (out.launch.push(c), slots--)
    }
  }
  return out
}

export function render(r, master) {
  const n = (xs) => xs.map((i) => `#${i.number}`).join(' ') || '-'
  return [
    `master: ${master}`,
    `launch:  ${n(r.launch)}`,
    `working: ${n(r.working)}`,
    `landing: ${n(r.landing)}`,
    `hold:    ${n(r.hold)}${r.hold.length ? ' (needs-decision)' : ''}`,
    ...r.wait.map((i) => `wait:    #${i.number} ${i.why}`),
    r.launch.length || r.working.length || r.landing.length || r.wait.length
      ? ''
      : 'DONE: nothing left to run',
  ]
    .filter(Boolean)
    .join('\n')
}

const run = (cmd, ...a) => execFileSync(cmd, a, { encoding: 'utf8' })
const json = (...a) => JSON.parse(run('gh', ...a))

function main() {
  run('git', 'fetch', 'origin', 'master', '--quiet')
  const sha = run('git', 'rev-parse', 'origin/master').trim()
  const [v] = json(
    'run',
    'list',
    '--workflow',
    'verify.yml',
    '--branch',
    'master',
    '--limit',
    '1',
    '--json',
    'headSha,conclusion,status',
  )
  let master = 'green'
  if (v?.headSha !== sha || v.status !== 'completed') {
    master = `unverified (verify ${v?.status ?? 'missing'} on ${v?.headSha?.slice(0, 7)}, master is ${sha.slice(0, 7)})`
    // Auto-merges fire no push run; ask for one instead of waiting for the hourly schedule.
    if (v?.status === 'completed')
      (run('gh', 'workflow', 'run', 'verify.yml', '--ref', 'master'),
        (master += ': dispatched verify, re-run in ~5 min'))
  } else if (v.conclusion !== 'success') master = 'RED: run /fix-ci on master first'

  const isShared = sharedMatcher(
    readFileSync(new URL('../.claude/skills/clear-issues/SKILL.md', import.meta.url), 'utf8'),
  )
  const issues = json(
    'issue',
    'list',
    '--state',
    'open',
    '--limit',
    '200',
    '--json',
    'number,title,body,labels',
  )
  const prs = json(
    'pr',
    'list',
    '--state',
    'open',
    '--limit',
    '100',
    '--json',
    'number,body,isDraft,labels,autoMergeRequest,statusCheckRollup',
  )
  console.log(render(plan({ issues, prs, masterGreen: master === 'green', isShared }), master))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
