/**
 * Drizzle is only a typed query layer here. Supabase migrations own the schema,
 * so never run `drizzle-kit generate/migrate/push` — only `pull`:
 *
 *   pnpm --filter @biblemates/server db:pull
 *
 * That runs scripts/db-pull.ts, which writes src/db/schema.ts (+ relations.ts)
 * from the live database.
 */
import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

if (existsSync(".env")) process.loadEnvFile(".env");
if (!process.env.DATABASE_URL) {
  throw new Error("Set DATABASE_URL in apps/server/.env (Supabase session pooler URL) before running db:pull.");
}

export default defineConfig({
  dialect: "postgresql",
  out: "./src/db",
  dbCredentials: { url: process.env.DATABASE_URL },
  // Only our tables. scripts/db-pull.ts adds the auth.users reference afterwards
  // (drizzle-kit emits invalid TS when it introspects Supabase's auth schema).
  schemaFilter: ["public"],
  tablesFilter: ["conversations", "messages"],
  introspect: { casing: "camel" },
});
