/**
 * Try the hybrid search from the terminal.
 *
 *   pnpm --filter @biblemates/server run search "anxiety"
 *   pnpm --filter @biblemates/server run search "mustard seed" --keyword   # full-text only (fallback path)
 */
import { formatPassage } from "@biblemates/shared";
import { embed, supabaseAdmin } from "../src/clients";
import { env } from "../src/env";

async function main() {
  const args = process.argv.slice(2);
  const keywordOnly = args.includes("--keyword");
  const query = args.filter((a) => !a.startsWith("--")).join(" ").trim();
  if (!query) throw new Error('Usage: search "your query" [--keyword]');

  const [embedding] = keywordOnly ? [null] : await embed([query]);
  const { data, error } = await supabaseAdmin.rpc("search_scripture", {
    query_text: query,
    query_embedding: embedding,
    match_count: 5,
    p_translation: env.SCRIPTURE_TRANSLATION,
  });
  if (error) throw new Error(error.message);

  const label = env.SCRIPTURE_TRANSLATION.toUpperCase() + (keywordOnly ? ", keyword only" : "");
  console.log(`\nTop ${data.length} for "${query}" (${label}):\n`);
  for (const [i, r] of (data as any[]).entries()) {
    const ref = formatPassage(r.book_id, r.chapter, r.verse_start, r.verse_end);
    const text = r.content.length > 220 ? `${r.content.slice(0, 217)}...` : r.content;
    console.log(`${i + 1}. ${ref}   (score ${r.score.toFixed(4)})\n   ${text}\n`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
