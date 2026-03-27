import type { TrackedChannel } from "../types/domain";
import { db } from "./db";

const mapChannel = (row: Record<string, unknown>): TrackedChannel => ({
  id: Number(row.id),
  peerId: String(row.peer_id),
  username: row.username ? String(row.username) : null,
  title: row.title ? String(row.title) : null,
  accessHash: row.access_hash ? String(row.access_hash) : null,
  enabled: Boolean(row.enabled),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
});

export class ChannelsRepository {
  list() {
    const rows = db
      .query("SELECT * FROM channels ORDER BY title COLLATE NOCASE ASC, username COLLATE NOCASE ASC")
      .all() as Record<string, unknown>[];

    return rows.map(mapChannel);
  }

  listEnabled() {
    const rows = db.query("SELECT * FROM channels WHERE enabled = 1").all() as Record<string, unknown>[];

    return rows.map(mapChannel);
  }

  getById(id: number) {
    const row = db.query("SELECT * FROM channels WHERE id = ?1").get(id) as Record<string, unknown> | null;

    return row ? mapChannel(row) : null;
  }

  getByPeerId(peerId: string) {
    const row = db.query("SELECT * FROM channels WHERE peer_id = ?1").get(peerId) as Record<string, unknown> | null;

    return row ? mapChannel(row) : null;
  }

  upsert(input: {
    peerId: string;
    username: string | null;
    title: string | null;
    accessHash: string | null;
    enabled?: boolean;
  }) {
    const now = new Date().toISOString();

    db.query(
      `INSERT INTO channels (peer_id, username, title, access_hash, enabled, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)
       ON CONFLICT(peer_id) DO UPDATE SET
         username = excluded.username,
         title = excluded.title,
         access_hash = excluded.access_hash,
         enabled = excluded.enabled,
         updated_at = excluded.updated_at`
    ).run(input.peerId, input.username, input.title, input.accessHash, input.enabled ?? true ? 1 : 0, now);

    return this.getByPeerId(input.peerId);
  }

  remove(id: number) {
    db.query("DELETE FROM channels WHERE id = ?1").run(id);
  }
}

export const channelsRepository = new ChannelsRepository();
