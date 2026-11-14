/**
 * Server configuration. Secrets live in apps/server/.env (gitignored) and are
 * never exposed to the mobile app.
 */
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as z from "zod";

const here = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.resolve(here, "../.env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  // The one translation that is embedded, searched and quoted by the chat.
  SCRIPTURE_TRANSLATION: z.string().toLowerCase().default("asv"),
  // Used from step 2 (chat). Optional until then.
  ANTHROPIC_API_KEY: z.string().optional(),
  CLAUDE_MODEL: z.string().default("claude-haiku-5-5"),
  // Postgres connection for Drizzle (session pooler, IPv4). Needed by `db:pull`
  // and the chat history queries; search works without it.
  DATABASE_URL: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  // 0.0.0.0 so a phone on the same Wi-Fi can reach the laptop.
  HOST: z.string().default("0.0.0.0"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Invalid server environment (check apps/server/.env):\n${missing}`);
  process.exit(1);
}

export const env = parsed.data;
