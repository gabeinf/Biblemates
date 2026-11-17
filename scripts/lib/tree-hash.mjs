// Content hash of the working tree (tracked + untracked, minus .gitignore'd files).
// Independent of commits: committing doesn't change it, editing any file does.
// Shared by scripts/verify.mjs (writes the stamp) and scripts/verify-gate.mjs (checks it).
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const STAMP_PATH = 'artifacts/.verify-stamp.json'

export function repoRoot() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
}

export function treeHash(cwd = repoRoot()) {
  // Stage everything into a throwaway index so the real index is never touched.
  const dir = mkdtempSync(join(tmpdir(), 'verify-index-'))
  const env = { ...process.env, GIT_INDEX_FILE: join(dir, 'index') }
  try {
    const git = (...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8' }).trim()
    git('read-tree', 'HEAD')
    git('add', '-A', '.')
    return git('write-tree')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
