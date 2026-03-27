import { and, eq, sql } from "drizzle-orm";

import type { KeywordRule, KeywordType } from "../types/domain";
import { orm } from "./db";
import { keywords } from "./schema";

const mapKeyword = (row: typeof keywords.$inferSelect): KeywordRule => ({
  id: row.id,
  ownerUserId: row.ownerUserId,
  type: row.type,
  value: row.value,
  enabled: row.enabled,
  createdAt: row.createdAt,
});

export class KeywordsRepository {
  list(ownerUserId: number) {
    return orm
      .select()
      .from(keywords)
      .where(eq(keywords.ownerUserId, ownerUserId))
      .orderBy(keywords.type, sql`${keywords.value} COLLATE NOCASE ASC`)
      .all()
      .map(mapKeyword);
  }

  listEnabled(ownerUserId: number) {
    return orm
      .select()
      .from(keywords)
      .where(and(eq(keywords.ownerUserId, ownerUserId), eq(keywords.enabled, true)))
      .orderBy(keywords.type, sql`${keywords.value} COLLATE NOCASE ASC`)
      .all()
      .map(mapKeyword);
  }

  add(ownerUserId: number, type: KeywordType, value: string) {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return null;
    }

    orm
      .insert(keywords)
      .values({
        ownerUserId,
        type,
        value: normalized,
        enabled: true,
        createdAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [keywords.ownerUserId, keywords.type, keywords.value],
        set: { enabled: true },
      })
      .run();

    const row = orm
      .select()
      .from(keywords)
      .where(and(eq(keywords.ownerUserId, ownerUserId), eq(keywords.type, type), eq(keywords.value, normalized)))
      .get();

    return row ? mapKeyword(row) : null;
  }

  remove(id: number, ownerUserId: number) {
    orm.delete(keywords).where(and(eq(keywords.id, id), eq(keywords.ownerUserId, ownerUserId))).run();
  }
}

export const keywordsRepository = new KeywordsRepository();
