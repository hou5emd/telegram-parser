import type { KeywordRule, KeywordType } from "../types/domain";
import { db } from "./db";

const mapKeyword = (row: Record<string, unknown>): KeywordRule => ({
  id: Number(row.id),
  type: String(row.type) as KeywordType,
  value: String(row.value),
  enabled: Boolean(row.enabled),
  createdAt: String(row.created_at),
});

export class KeywordsRepository {
  list() {
    const rows = db.query("SELECT * FROM keywords ORDER BY type ASC, value COLLATE NOCASE ASC").all() as Record<string, unknown>[];

    return rows.map(mapKeyword);
  }

  listEnabled() {
    const rows = db.query("SELECT * FROM keywords WHERE enabled = 1 ORDER BY type ASC, value COLLATE NOCASE ASC").all() as Record<string, unknown>[];

    return rows.map(mapKeyword);
  }

  add(type: KeywordType, value: string) {
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return null;
    }

    db.query(
      "INSERT INTO keywords (type, value, enabled, created_at) VALUES (?1, ?2, 1, ?3) ON CONFLICT(type, value) DO UPDATE SET enabled = 1"
    ).run(type, normalized, new Date().toISOString());

    const row = db.query("SELECT * FROM keywords WHERE type = ?1 AND value = ?2").get(type, normalized) as Record<string, unknown> | null;

    return row ? mapKeyword(row) : null;
  }

  remove(id: number) {
    db.query("DELETE FROM keywords WHERE id = ?1").run(id);
  }
}

export const keywordsRepository = new KeywordsRepository();
