import { and, desc, eq, sql } from "drizzle-orm";

import type { MatchRecord, ParserInputMessage, RawMessageRecord } from "../types/domain";
import { orm } from "./db";
import { matches, rawMessages, users } from "./schema";

const mapRawMessage = (row: typeof rawMessages.$inferSelect): RawMessageRecord => ({
  id: row.id,
  ownerUserId: row.ownerUserId,
  sourcePeerId: row.sourcePeerId,
  telegramMessageId: row.telegramMessageId,
  channelUsername: row.channelUsername,
  channelTitle: row.channelTitle,
  text: row.text,
  messageDate: row.messageDate,
  permalink: row.permalink,
  hash: row.hash,
  matched: row.matched,
  createdAt: row.createdAt,
});

const mapMatch = (row: {
  matches: typeof matches.$inferSelect;
  raw_messages: typeof rawMessages.$inferSelect;
  users: typeof users.$inferSelect;
}): MatchRecord => ({
  id: row.matches.id,
  ownerUserId: row.matches.ownerUserId,
  ownerTelegramUserId: row.users.telegramUserId,
  rawMessageId: row.matches.rawMessageId,
  matchedKeywords: JSON.parse(row.matches.matchedKeywords) as string[],
  forwardedAt: row.matches.forwardedAt,
  createdAt: row.matches.createdAt,
  sourcePeerId: row.raw_messages.sourcePeerId,
  telegramMessageId: row.raw_messages.telegramMessageId,
  channelUsername: row.raw_messages.channelUsername,
  channelTitle: row.raw_messages.channelTitle,
  text: row.raw_messages.text,
  messageDate: row.raw_messages.messageDate,
  permalink: row.raw_messages.permalink,
});

export class MatchesRepository {
  saveRawMessage(input: ParserInputMessage & { hash: string }) {
    const now = new Date().toISOString();

    orm
      .insert(rawMessages)
      .values({
        ownerUserId: input.ownerUserId,
        sourcePeerId: input.sourcePeerId,
        telegramMessageId: input.telegramMessageId,
        channelUsername: input.channelUsername,
        channelTitle: input.channelTitle,
        text: input.text,
        messageDate: input.messageDate,
        permalink: input.permalink,
        hash: input.hash,
        createdAt: now,
      })
      .onConflictDoUpdate({
        target: [rawMessages.ownerUserId, rawMessages.sourcePeerId, rawMessages.telegramMessageId],
        set: {
          channelUsername: input.channelUsername,
          channelTitle: input.channelTitle,
          text: input.text,
          messageDate: input.messageDate,
          permalink: input.permalink,
          hash: input.hash,
        },
      })
      .run();

    const row = orm
      .select()
      .from(rawMessages)
      .where(
        and(
          eq(rawMessages.ownerUserId, input.ownerUserId),
          eq(rawMessages.sourcePeerId, input.sourcePeerId),
          eq(rawMessages.telegramMessageId, input.telegramMessageId)
        )
      )
      .get();

    return row ? mapRawMessage(row) : null;
  }

  createMatch(ownerUserId: number, rawMessageId: number, matchedKeywords: string[]) {
    const now = new Date().toISOString();

    orm.update(rawMessages).set({ matched: true }).where(eq(rawMessages.id, rawMessageId)).run();
    orm
      .insert(matches)
      .values({
        ownerUserId,
        rawMessageId,
        matchedKeywords: JSON.stringify(matchedKeywords),
        createdAt: now,
      })
      .onConflictDoNothing({ target: matches.rawMessageId })
      .run();

    return this.getByRawMessageId(rawMessageId);
  }

  getByRawMessageId(rawMessageId: number) {
    const row = orm
      .select()
      .from(matches)
      .innerJoin(rawMessages, eq(rawMessages.id, matches.rawMessageId))
      .innerJoin(users, eq(users.id, matches.ownerUserId))
      .where(eq(matches.rawMessageId, rawMessageId))
      .get();

    return row ? mapMatch(row) : null;
  }

  list(ownerUserId: number, limit = 10) {
    return orm
      .select()
      .from(matches)
      .innerJoin(rawMessages, eq(rawMessages.id, matches.rawMessageId))
      .innerJoin(users, eq(users.id, matches.ownerUserId))
      .where(eq(matches.ownerUserId, ownerUserId))
      .orderBy(desc(matches.createdAt))
      .limit(limit)
      .all()
      .map(mapMatch);
  }

  markForwarded(matchId: number) {
    orm.update(matches).set({ forwardedAt: new Date().toISOString() }).where(eq(matches.id, matchId)).run();
  }

  countMatches(ownerUserId: number) {
    const row = orm.select({ count: sql<number>`count(*)` }).from(matches).where(eq(matches.ownerUserId, ownerUserId)).get();

    return Number(row?.count ?? 0);
  }

  countMatchesAll() {
    const row = orm.select({ count: sql<number>`count(*)` }).from(matches).get();

    return Number(row?.count ?? 0);
  }

  countRawMessages(ownerUserId: number) {
    const row = orm.select({ count: sql<number>`count(*)` }).from(rawMessages).where(eq(rawMessages.ownerUserId, ownerUserId)).get();

    return Number(row?.count ?? 0);
  }

  countRawMessagesAll() {
    const row = orm.select({ count: sql<number>`count(*)` }).from(rawMessages).get();

    return Number(row?.count ?? 0);
  }
}

export const matchesRepository = new MatchesRepository();
