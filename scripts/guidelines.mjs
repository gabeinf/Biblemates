// CI gate: checks the scriptable rules from CLAUDE.md on a PR. Zero tokens, runs in seconds.
// Passing means "nothing here needs more testing by the rules"; a human still merges.
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const SELF = /^scripts\/guidelines\.(mjs|test\.mjs)$/
const NOISE = /(^|\/)(pnpm-lock\.yaml|eslint-suppressions\.json)$|\.(png|jpe?g)$/i
// Anything that can change behavior or pixels must come with something that measures it.
const TESTABLE =
  /^(apps\/mobile\/src\/(lib|hooks|services|app|components)|packages\/shared\/src)\/.+\.tsx?$/
const TEST = /\.test\.tsx?$|^e2e\/.+\.spec\.ts$/
const SKIPPED = /\b(?:it|test|describe)\.(?:skip|only)\b|\bx(?:it|describe)\(/
const DEP_KEYS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

// Size is deliberately not a rule: what matters is that the change is measurable.
// ctx: { branch, body, labels[], files[{path,add,del}], added{path:[line]}, newDeps[], suppressionsDelta }
export function check(ctx) {
  const fails = []
  const real = ctx.files.filter((f) => !NOISE.test(f.path))

  if (!/^(feat|fix|chore)\//.test(ctx.branch))
    fails.push(`branch "${ctx.branch}" must start with feat/, fix/ or chore/`)
  if (ctx.newDeps.length && !ctx.labels.includes('deps-approved'))
    fails.push(
      `new dependencies (${ctx.newDeps.join(', ')}): ask first, then add the "deps-approved" label`,
    )

  const addedText = Object.entries(ctx.added).filter(([, ls]) => ls)
  if (addedText.some(([, ls]) => ls.some((l) => /eslint-disable/.test(l))))
    fails.push('adds an eslint-disable')
  if (ctx.suppressionsDelta > 0)
    fails.push('grows eslint-suppressions.json (baseline may only shrink)')
  if (addedText.some(([, ls]) => ls.some((l) => SKIPPED.test(l))))
    fails.push('adds a skipped or focused test')

  const testable = real.filter((f) => TESTABLE.test(f.path) && !TEST.test(f.path))
  if (testable.length && !real.some((f) => TEST.test(f.path)))
    fails.push(`${testable[0].path} changed but no Jest test or e2e spec did`)

  if (real.some((f) => f.path.startsWith('design/reference/') && !f.path.endsWith('README.md')))
    fails.push('adds files under design/reference/ (kept local, never committed)')

  if (!/\bCloses #\d+/.test(ctx.body)) fails.push('PR body needs "Closes #<issue>"')
  if (/- \[ \]/.test(ctx.body)) fails.push('PR body has unticked checkboxes')
  if (ctx.body.includes('❌')) fails.push('PR body lists ❌ spec items: not done yet')
  return fails
}

const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28 })
const show = (rev, path) => {
  try {
    return git('show', `${rev}:${path}`)
  } catch {
    return null // file doesn't exist at that revision
  }
}
const depNames = (json) => {
  const o = json ? JSON.parse(json) : {}
  return new Set(DEP_KEYS.flatMap((k) => Object.keys(o[k] ?? {})))
}
const countSum = (json) => {
  let n = 0
  JSON.stringify(json ? JSON.parse(json) : {}, (_, v) =>
    typeof v?.count === 'number' ? ((n += v.count), v) : v,
  )
  return n
}

function main() {
  const { BASE_SHA: base, HEAD_SHA: head, BRANCH, PR_BODY = '', LABELS = '' } = process.env
  const range = `${base}...${head}`
  const files = git('diff', '--numstat', range)
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [add, del, path] = l.split('\t')
      return { path, add: Number(add) || 0, del: Number(del) || 0 } // binary files show "-"
    })
  const added = {}
  let cur
  for (const l of git('diff', '-U0', range).split('\n')) {
    // The gate's own files quote the patterns it forbids, so don't scan them.
    if (l.startsWith('+++ b/')) added[(cur = l.slice(6))] = SELF.test(l.slice(6)) ? null : []
    else if (added[cur] && l.startsWith('+') && !l.startsWith('+++')) added[cur].push(l.slice(1))
  }
  const newDeps = files
    .filter((f) => f.path.endsWith('package.json'))
    .flatMap((f) => {
      const before = depNames(show(base, f.path))
      return [...depNames(show(head, f.path))].filter((d) => !before.has(d))
    })
  const sup = 'apps/mobile/eslint-suppressions.json'
  const suppressionsDelta = countSum(show(head, sup)) - countSum(show(base, sup))
  const fails = check({
    branch: BRANCH,
    body: PR_BODY,
    labels: LABELS.split(',').filter(Boolean),
    files,
    added,
    newDeps,
    suppressionsDelta,
  })
  if (fails.length) {
    console.error(
      `guidelines: ${fails.length} problem(s)\n${fails.map((f) => `  ✗ ${f}`).join('\n')}`,
    )
    process.exit(1)
  }
  console.log('guidelines: all scripted rules pass')
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
