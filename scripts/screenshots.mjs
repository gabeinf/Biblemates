// verify step 4: export the web build, then let Playwright capture every /onboarding/* route.
// Uses placeholder env (and ignores .env files) so local runs match CI and never hit the real backend.
import { spawnSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import { repoRoot } from './lib/tree-hash.mjs'

const root = repoRoot()

const env = {
  ...process.env,
  EXPO_NO_DOTENV: '1',
  EXPO_NO_TELEMETRY: '1',
  EXPO_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321',
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'placeholder-publishable-key',
  EXPO_PUBLIC_SERVER_URL: 'http://127.0.0.1:3999',
}

function run(cmd, args) {
  const { status } = spawnSync(cmd, args, { cwd: root, env, stdio: 'inherit' })
  if (status !== 0) process.exit(status ?? 1)
}

rmSync(`${root}/artifacts/screenshots`, { recursive: true, force: true })
run('pnpm', ['--dir', 'apps/mobile', 'exec', 'expo', 'export', '-p', 'web', '--output-dir', '../../artifacts/web'])
run('pnpm', ['exec', 'playwright', 'test'])
