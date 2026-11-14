import { relations } from "drizzle-orm/relations";
import { usersInAuth, conversations, messages } from "./schema";

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	usersInAuth: one(usersInAuth, {
		fields: [conversations.userId],
		references: [usersInAuth.id]
	}),
	messages: many(messages),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	conversations: many(conversations),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
}));