// Stop hook: blocks Claude from ending a turn that claims work is done
// unless `pnpm verify` passed on exactly the current working tree.
//
// - Content-based: the stamp stores a hash of the working tree (scripts/lib/tree-hash.mjs),
//   so any edit after the last passing verify invalidates it, but committing doesn't.
// - Loop-safe: if Claude is already continuing because of this hook (stop_hook_active),
//   it lets the turn end; Claude Code also caps consecutive stop-hook blocks.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { STAMP_PATH, treeHash } from './lib/tree-hash.mjs'

const input = JSON.parse((await new Response(process.stdin).text()) || '{}')
if (input.stop_hook_active) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
const message = input.last_assistant_message ?? lastAssistantText(input.transcript_path)

// Only gate turns that claim completion.
const CLAIMS_DONE =
  /\b(task is (done|complete)|(is|are|now) (done|complete|ready)|ready for review|all (checks|tests) pass|verify (passed|is green)|PR (is )?(open|opened|created|up)|opened (a |the )?PR|implemented|finished)\b/i
if (!message || !CLAIMS_DONE.test(message)) process.exit(0)

let stamp = null
try {
  stamp = JSON.parse(readFileSync(join(root, STAMP_PATH), 'utf8'))
} catch {}

const current = treeHash(root)
if (stamp?.tree === current) process.exit(0)

const why = stamp
  ? `files changed after the last passing verify (${stamp.at})`
  : 'there is no passing verify on record'
console.log(
  JSON.stringify({
    decision: 'block',
    reason:
      `verify-gate: your last message claims the work is done, but ${why}. ` +
      'Run `pnpm verify`, show its output, and fix any failures before claiming done. ' +
      'If you were not claiming a code task is done, say so briefly and stop.',
  }),
)

/** Fallback for older Claude Code versions without last_assistant_message. */
function lastAssistantText(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return ''
  const lines = readFileSync(transcriptPath, 'utf8').trim().split('\n').reverse()
  for (const line of lines) {
    try {
      const entry = JSON.parse(line)
      if (entry.type !== 'assistant') continue
      const text = (entry.message?.content ?? [])
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n')
      if (text) return text
    } catch {}
  }
  return ''
}
