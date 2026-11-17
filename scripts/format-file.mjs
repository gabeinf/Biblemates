// PostToolUse hook (Edit|Write): runs Prettier on the file Claude just changed.
// Never blocks: formatting problems are reported to Claude as context, not errors.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { relative } from 'node:path'

const input = JSON.parse(await new Response(process.stdin).text() || '{}')
const file = input.tool_input?.file_path
const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()

if (!file || !existsSync(file) || relative(root, file).startsWith('..')) process.exit(0)

// --ignore-unknown skips unsupported types; .prettierignore is respected.
const { status, stderr } = spawnSync(
  'pnpm',
  ['exec', 'prettier', '--write', '--ignore-unknown', '--log-level', 'warn', file],
  { cwd: root, encoding: 'utf8' },
)
if (status !== 0) console.error(`prettier failed on ${relative(root, file)}:\n${stderr}`)
process.exit(0)
