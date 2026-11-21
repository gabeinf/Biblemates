// `pnpm verify`: the machine-checkable definition of "done".
// Runs typecheck → lint → test → screenshots, stops at the first failure, exits non-zero.
// On success it writes artifacts/.verify-stamp.json, which the Stop hook (verify-gate) checks.
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { STAMP_PATH, repoRoot, treeHash } from './lib/tree-hash.mjs'

const root = repoRoot()
const mobile = ['--dir', 'apps/mobile', 'exec']

const steps = [
  { name: 'typecheck', cmd: 'pnpm', args: [...mobile, 'tsc', '--noEmit'] },
  { name: 'lint', cmd: 'pnpm', args: [...mobile, 'eslint', '.'] },
  { name: 'style', cmd: 'node', args: ['scripts/check-style.mjs'] },
  { name: 'contrast', cmd: 'pnpm', args: ['exec', 'tsx', 'scripts/check-contrast.ts'] },
  { name: 'test', cmd: 'pnpm', args: [...mobile, 'jest', '--ci'] },
  { name: 'screenshots', cmd: 'node', args: ['scripts/screenshots.mjs'] },
]

// Optional: `pnpm verify lint test` runs a subset (handy while iterating; never counts as "done").
const only = process.argv.slice(2)
const selected = only.length ? steps.filter((s) => only.includes(s.name)) : steps

// Hash before running, so edits made *during* verify invalidate the stamp.
const hashBefore = treeHash(root)
rmSync(join(root, STAMP_PATH), { force: true })

const results = []
for (const step of selected) {
  console.log(`\n━━━ verify: ${step.name} ━━━`)
  const started = Date.now()
  const { status } = spawnSync(step.cmd, step.args, { cwd: root, stdio: 'inherit' })
  const secs = ((Date.now() - started) / 1000).toFixed(1)
  results.push({ name: step.name, ok: status === 0, secs })
  if (status !== 0) break
}

console.log('\n━━━ verify summary ━━━')
for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name.padEnd(12)} ${r.secs}s`)
for (const s of selected.slice(results.length)) console.log(`⏭  ${s.name.padEnd(12)} skipped`)

const passed = results.length === selected.length && results.every((r) => r.ok)
if (!passed) {
  console.log('\nverify FAILED')
  process.exit(1)
}

if (only.length) {
  console.log(`\nverify passed (partial: ${only.join(', ')}); no stamp written`)
  process.exit(0)
}

if (treeHash(root) !== hashBefore) {
  console.log('\nverify passed, but files changed while it ran; re-run to get a clean stamp')
  process.exit(1)
}

mkdirSync(dirname(join(root, STAMP_PATH)), { recursive: true })
writeFileSync(
  join(root, STAMP_PATH),
  JSON.stringify({ tree: hashBefore, at: new Date().toISOString() }, null, 2) + '\n',
)
console.log('\nverify PASSED')
