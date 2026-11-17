// Stop hook: blocks Claude from ending a turn that claims work is done
// unless `pnpm verify` passed on exactly the current working tree.
//
// - Content-based: the stamp stores a hash of the working tree (scripts/lib/tree-hash.mjs),
//   so any edit after the last passing verify invalidates it, but committing doesn't.
// - Loop-safe: if Claude is already continuing because of this hook (stop_hook_active),
//   it lets the turn end; Claude Code also caps consecutive stop-hook blocks.
// - Only gates sessions where Claude edited files: status updates and Q&A pass through.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { STAMP_PATH, treeHash } from './lib/tree-hash.mjs'

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])

const input = JSON.parse((await new Response(process.stdin).text()) || '{}')
if (input.stop_hook_active) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
const transcript = readTranscript(input.transcript_path)

// Nothing was edited this session → nothing to verify.
if (!transcript.some(usedEditTool)) process.exit(0)

const message = input.last_assistant_message ?? lastAssistantText(transcript)

// Only gate turns that claim completion.
const CLAIMS_DONE =
  /\b(task is (done|complete)|(is|are) (now )?(done|complete)|ready for review|all (checks|tests) pass(ed)?|verify (passed|is green)|PR (is )?(open|opened|created|up)|opened (a |the )?PR|implemented|finished)\b/i
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

/** Parsed transcript entries (JSONL); [] if unavailable. */
function readTranscript(transcriptPath) {
  if (!transcriptPath || !existsSync(transcriptPath)) return []
  return readFileSync(transcriptPath, 'utf8')
    .split('\n')
    .flatMap((line) => {
      try {
        return line ? [JSON.parse(line)] : []
      } catch {
        return []
      }
    })
}

function assistantContent(entry) {
  return entry.type === 'assistant' && Array.isArray(entry.message?.content)
    ? entry.message.content
    : []
}

function usedEditTool(entry) {
  return assistantContent(entry).some((c) => c.type === 'tool_use' && EDIT_TOOLS.has(c.name))
}

/** Fallback for older Claude Code versions without last_assistant_message. */
function lastAssistantText(entries) {
  for (const entry of [...entries].reverse()) {
    const text = assistantContent(entry)
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('\n')
    if (text) return text
  }
  return ''
}
