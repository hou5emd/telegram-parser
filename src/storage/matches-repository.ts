import type { MatchRecord, ParserInputMessage, RawMessageRecord } from "../types/domain";
import { db } from "./db";

const mapRawMessage = (row: Record<string, unknown>): RawMessageRecord => ({
  id: Number(row.id),
  sourcePeerId: String(row.source_peer_id),
  telegramMessageId: Number(row.telegram_message_id),
  channelUsername: row.channel_username ? String(row.channel_username) : null,
  channelTitle: row.channel_title ? String(row.channel_title) : null,
  text: String(row.text),
  messageDate: row.message_date ? String(row.message_date) : null,
  permalink: row.permalink ? String(row.permalink) : null,
  hash: String(row.hash),
  matched: Boolean(row.matched),
  createdAt: String(row.created_at),
});

const mapMatch = (row: Record<string, unknown>): MatchRecord => ({
  id: Number(row.id),
  rawMessageId: Number(row.raw_message_id),
  matchedKeywords: JSON.parse(String(row.matched_keywords)) as string[],
  forwardedAt: row.forwarded_at ? String(row.forwarded_at) : null,
  createdAt: String(row.created_at),
  sourcePeerId: String(row.source_peer_id),
  telegramMessageId: Number(row.telegram_message_id),
  channelUsername: row.channel_username ? String(row.channel_username) : null,
  channelTitle: row.channel_title ? String(row.channel_title) : null,
  text: String(row.text),
  messageDate: row.message_date ? String(row.message_date) : null,
  permalink: row.permalink ? String(row.permalink) : null,
});

export class MatchesRepository {
  saveRawMessage(input: ParserInputMessage & { hash: string }) {
    const now = new Date().toISOString();

    db.query(
      `INSERT INTO raw_messages (
        source_peer_id,
        telegram_message_id,
        channel_username,
        channel_title,
        text,
        message_date,
        permalink,
        hash,
        created_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
      ON CONFLICT(source_peer_id, telegram_message_id) DO UPDATE SET
        channel_username = excluded.channel_username,
        channel_title = excluded.channel_title,
        text = excluded.text,
        message_date = excluded.message_date,
        permalink = excluded.permalink,
        hash = excluded.hash`
    ).run(
      input.sourcePeerId,
      input.telegramMessageId,
      input.channelUsername,
      input.channelTitle,
      input.text,
      input.messageDate,
      input.permalink,
      input.hash,
      now
    );

    const row = db.query("SELECT * FROM raw_messages WHERE source_peer_id = ?1 AND telegram_message_id = ?2").get(
      input.sourcePeerId,
      input.telegramMessageId
    ) as Record<string, unknown> | null;

    return row ? mapRawMessage(row) : null;
  }

  createMatch(rawMessageId: number, matchedKeywords: string[]) {
    const now = new Date().toISOString();

    db.query("UPDATE raw_messages SET matched = 1 WHERE id = ?1").run(rawMessageId);
    db.query(
      `INSERT INTO matches (raw_message_id, matched_keywords, created_at)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(raw_message_id) DO NOTHING`
    ).run(rawMessageId, JSON.stringify(matchedKeywords), now);

    return this.getByRawMessageId(rawMessageId);
  }

  getByRawMessageId(rawMessageId: number) {
    const row = db
      .query(
        `SELECT matches.*, raw_messages.source_peer_id, raw_messages.telegram_message_id, raw_messages.channel_username,
                raw_messages.channel_title, raw_messages.text, raw_messages.message_date, raw_messages.permalink
         FROM matches
         INNER JOIN raw_messages ON raw_messages.id = matches.raw_message_id
         WHERE raw_message_id = ?1`
      )
      .get(rawMessageId) as Record<string, unknown> | null;

    return row ? mapMatch(row) : null;
  }

  list(limit = 50) {
    const rows = db
      .query(
        `SELECT matches.*, raw_messages.source_peer_id, raw_messages.telegram_message_id, raw_messages.channel_username,
                raw_messages.channel_title, raw_messages.text, raw_messages.message_date, raw_messages.permalink
         FROM matches
         INNER JOIN raw_messages ON raw_messages.id = matches.raw_message_id
         ORDER BY matches.created_at DESC
         LIMIT ?1`
      )
      .all(limit) as Record<string, unknown>[];

    return rows.map(mapMatch);
  }

  markForwarded(matchId: number) {
    db.query("UPDATE matches SET forwarded_at = ?2 WHERE id = ?1").run(matchId, new Date().toISOString());
  }

  countMatches() {
    const row = db.query("SELECT COUNT(*) AS count FROM matches").get() as { count: number };

    return Number(row.count);
  }

  countRawMessages() {
    const row = db.query("SELECT COUNT(*) AS count FROM raw_messages").get() as { count: number };

    return Number(row.count);
  }
}

export const matchesRepository = new MatchesRepository();
