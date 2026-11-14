/**
 * `pnpm --filter @biblemates/server db:pull`
 *
 * Runs `drizzle-kit pull`, then fixes up its output for Supabase:
 *  - our tables reference auth.users, which isn't pulled, so define a minimal
 *    `users` (auth.users.id) for the foreign keys and relations to resolve;
 *  - delete the SQL migration drizzle-kit writes: Supabase migrations own the schema.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "src/db");

execFileSync(path.join(root, "node_modules/.bin/drizzle-kit"), ["pull"], { cwd: root, stdio: "inherit" });

const AUTH_USERS = `
// Added by scripts/db-pull.ts: the auth.users columns our foreign keys need.
import { pgSchema as _pgSchema, uuid as _uuid } from "drizzle-orm/pg-core"
export const usersInAuth = _pgSchema("auth").table("users", { id: _uuid().primaryKey().notNull() })
const users = usersInAuth
`;

const schemaFile = path.join(out, "schema.ts");
let schema = readFileSync(schemaFile, "utf8");
if (!schema.includes("usersInAuth")) {
  schema = schema.replace(/(import \{ sql \} from "drizzle-orm"\n)/, `$1${AUTH_USERS}`);
  writeFileSync(schemaFile, schema);
}

const relationsFile = path.join(out, "relations.ts");
const relations = readFileSync(relationsFile, "utf8");
if (!relations.includes('from "./schema"')) throw new Error("unexpected relations.ts shape");

for (const f of readdirSync(out)) {
  if (f.endsWith(".sql")) rmSync(path.join(out, f));
}
rmSync(path.join(out, "meta"), { recursive: true, force: true });
console.log("db:pull: patched schema.ts for auth.users and removed drizzle migration files.");
