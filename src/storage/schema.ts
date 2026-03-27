import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { KeywordType } from "../types/domain";

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  telegramUserId: integer("telegram_user_id").notNull(),
  username: text("username"),
  firstName: text("first_name"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("users_telegram_user_id_unique").on(table.telegramUserId)]);

export const telegramSessions = sqliteTable("telegram_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: integer("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  apiId: integer("api_id").notNull(),
  apiHash: text("api_hash").notNull(),
  phoneNumber: text("phone_number"),
  session: text("session"),
  meId: text("me_id"),
  meUsername: text("me_username"),
  meFirstName: text("me_first_name"),
  meLastName: text("me_last_name"),
  mePhone: text("me_phone"),
  authorizedAt: text("authorized_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [uniqueIndex("telegram_sessions_owner_unique").on(table.ownerUserId)]);

export const channels = sqliteTable("channels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: integer("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  peerId: text("peer_id").notNull(),
  username: text("username"),
  title: text("title"),
  accessHash: text("access_hash"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("channels_owner_peer_unique").on(table.ownerUserId, table.peerId),
  index("idx_channels_owner_enabled").on(table.ownerUserId, table.enabled),
  index("idx_channels_peer_enabled").on(table.peerId, table.enabled),
]);

export const keywords = sqliteTable("keywords", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: integer("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<KeywordType>().notNull(),
  value: text("value").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("keywords_owner_type_value_unique").on(table.ownerUserId, table.type, table.value),
  index("idx_keywords_owner_enabled").on(table.ownerUserId, table.enabled),
]);

export const rawMessages = sqliteTable("raw_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: integer("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sourcePeerId: text("source_peer_id").notNull(),
  telegramMessageId: integer("telegram_message_id").notNull(),
  channelUsername: text("channel_username"),
  channelTitle: text("channel_title"),
  text: text("text").notNull(),
  messageDate: text("message_date"),
  permalink: text("permalink"),
  hash: text("hash").notNull(),
  matched: integer("matched", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("raw_messages_owner_peer_message_unique").on(table.ownerUserId, table.sourcePeerId, table.telegramMessageId),
  index("idx_raw_messages_owner_created").on(table.ownerUserId, table.createdAt),
  index("idx_raw_messages_peer_owner").on(table.sourcePeerId, table.ownerUserId),
]);

export const matches = sqliteTable("matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ownerUserId: integer("owner_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rawMessageId: integer("raw_message_id").notNull().references(() => rawMessages.id, { onDelete: "cascade" }),
  matchedKeywords: text("matched_keywords").notNull(),
  forwardedAt: text("forwarded_at"),
  createdAt: text("created_at").notNull(),
}, (table) => [
  uniqueIndex("matches_raw_message_unique").on(table.rawMessageId),
  index("idx_matches_owner_created").on(table.ownerUserId, table.createdAt),
]);
