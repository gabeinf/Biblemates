import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { env } from "./env";

/** Service-role client: bypasses RLS. Server-side only. */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/** Embeds many strings in one request; results come back in input order. */
export async function embed(inputs: string[], opts: { signal?: AbortSignal } = {}): Promise<number[][]> {
  const res = await openai.embeddings.create(
    { model: env.EMBEDDING_MODEL, input: inputs },
    // No retries when a deadline is set: the caller falls back instead of waiting.
    opts.signal ? { signal: opts.signal, maxRetries: 0 } : undefined,
  );
  return res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}
