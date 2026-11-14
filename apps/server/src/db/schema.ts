import { pgTable, index, foreignKey, pgPolicy, check, uuid, text, timestamp, jsonb, boolean, pgSequence } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// Added by scripts/db-pull.ts: the auth.users columns our foreign keys need.
import { pgSchema as _pgSchema, uuid as _uuid } from "drizzle-orm/pg-core"
export const usersInAuth = _pgSchema("auth").table("users", { id: _uuid().primaryKey().notNull() })
const users = usersInAuth


export const todosIdSeq = pgSequence("todos_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })

export const conversations = pgTable("conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").default(sql`auth.uid()`).notNull(),
	title: text(),
	mood: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("conversations_user_recent").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "conversations_user_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("bm_conversations_read", { as: "permissive", for: "select", to: ["public"], using: sql`(user_id = auth.uid())` }),
	pgPolicy("bm_conversations_delete", { as: "permissive", for: "delete", to: ["public"] }),
	check("conversations_title_check", sql`char_length(title) <= 120`),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	citations: jsonb().default([]).notNull(),
	crisis: boolean().default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("messages_conversation_created").using("btree", table.conversationId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_fkey"
		}).onDelete("cascade"),
	pgPolicy("bm_messages_read", { as: "permissive", for: "select", to: ["public"], using: sql`(EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND (c.user_id = auth.uid()))))` }),
	check("messages_role_check", sql`role = ANY (ARRAY['user'::text, 'assistant'::text])`),
]);
