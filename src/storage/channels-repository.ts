import { and, eq, sql } from "drizzle-orm";

import type { TrackedChannel } from "../types/domain";
import { orm } from "./db";
import { channels } from "./schema";

const mapChannel = (row: typeof channels.$inferSelect): TrackedChannel => ({
  id: row.id,
  ownerUserId: row.ownerUserId,
  peerId: row.peerId,
  username: row.username,
  title: row.title,
  accessHash: row.accessHash,
  enabled: row.enabled,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export class ChannelsRepository {
  list(ownerUserId: number) {
    return orm
      .select()
      .from(channels)
      .where(eq(channels.ownerUserId, ownerUserId))
      .orderBy(sql`${channels.title} COLLATE NOCASE ASC`, sql`${channels.username} COLLATE NOCASE ASC`)
      .all()
      .map(mapChannel);
  }

  listEnabled(ownerUserId: number) {
    return orm
      .select()
      .from(channels)
      .where(and(eq(channels.ownerUserId, ownerUserId), eq(channels.enabled, true)))
      .all()
      .map(mapChannel);
  }

  listEnabledByPeerId(peerId: string) {
    return orm
      .select()
      .from(channels)
      .where(and(eq(channels.peerId, peerId), eq(channels.enabled, true)))
      .all()
      .map(mapChannel);
  }

  countEnabledAll() {
    const row = orm.select({ count: sql<number>`count(*)` }).from(channels).where(eq(channels.enabled, true)).get();

    return Number(row?.count ?? 0);
  }

  getById(id: number, ownerUserId: number) {
    const row = orm.select().from(channels).where(and(eq(channels.id, id), eq(channels.ownerUserId, ownerUserId))).get();

    return row ? mapChannel(row) : null;
  }

  getByPeerId(peerId: string, ownerUserId: number) {
    const row = orm.select().from(channels).where(and(eq(channels.peerId, peerId), eq(channels.ownerUserId, ownerUserId))).get();

    return row ? mapChannel(row) : null;
  }

  upsert(input: {
    ownerUserId: number;
    peerId: string;
    username: string | null;
    title: string | null;
    accessHash: string | null;
    enabled?: boolean;
  }) {
    const now = new Date().toISOString();

    orm
      .insert(channels)
      .values({
        ownerUserId: input.ownerUserId,
        peerId: input.peerId,
        username: input.username,
        title: input.title,
        accessHash: input.accessHash,
        enabled: input.enabled ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [channels.ownerUserId, channels.peerId],
        set: {
          username: input.username,
          title: input.title,
          accessHash: input.accessHash,
          enabled: input.enabled ?? true,
          updatedAt: now,
        },
      })
      .run();

    return this.getByPeerId(input.peerId, input.ownerUserId);
  }

  remove(id: number, ownerUserId: number) {
    orm.delete(channels).where(and(eq(channels.id, id), eq(channels.ownerUserId, ownerUserId))).run();
  }
}

export const channelsRepository = new ChannelsRepository();
