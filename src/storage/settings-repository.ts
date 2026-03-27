import { db } from "./db";

const getStatement = db.query("SELECT value FROM settings WHERE key = ?1");
const setStatement = db.query(
  "INSERT INTO settings (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
);
const deleteStatement = db.query("DELETE FROM settings WHERE key = ?1");

export class SettingsRepository {
  get(key: string) {
    const row = getStatement.get(key) as { value: string } | null;

    return row?.value ?? null;
  }

  set(key: string, value: string) {
    setStatement.run(key, value, new Date().toISOString());
  }

  delete(key: string) {
    deleteStatement.run(key);
  }
}

export const settingsRepository = new SettingsRepository();
