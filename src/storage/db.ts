import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

import { env } from "../config/env";
import * as schema from "./schema";

const databasePath = resolve(env.databasePath);

mkdirSync(dirname(databasePath), { recursive: true });

export const db = new Database(databasePath, { create: true, strict: true });
export const orm = drizzle({ client: db, schema });

const defaultOwnerTelegramUserId = env.adminTelegramUserId ?? 0;

const hasTable = (tableName: string) => {
  const row = db
    .query("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?1")
    .get(tableName) as { name: string } | null;

  return Boolean(row);
};

const hasColumn = (tableName: string, columnName: string) => {
  if (!hasTable(tableName)) {
    return false;
  }

  const columns = db.query(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;

  return columns.some((column) => column.name === columnName);
};

const seedDefaultUser = () => {
  if (!defaultOwnerTelegramUserId) {
    return;
  }

  const now = new Date().toISOString();

  db.query(
    `INSERT INTO users (telegram_user_id, username, first_name, created_at, updated_at)
     VALUES (?1, NULL, NULL, ?2, ?2)
     ON CONFLICT(telegram_user_id) DO NOTHING`
  ).run(defaultOwnerTelegramUserId, now);
};

const migrateLegacySchema = () => {
  if (!hasTable("channels") || hasColumn("channels", "owner_user_id")) {
    return;
  }

  if (!defaultOwnerTelegramUserId) {
    throw new Error("ADMIN_TELEGRAM_USER_ID is required to migrate legacy parser data");
  }

  db.exec("BEGIN");

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_user_id INTEGER NOT NULL UNIQUE,
        username TEXT,
        first_name TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE channels_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER NOT NULL,
        peer_id TEXT NOT NULL,
        username TEXT,
        title TEXT,
        access_hash TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(owner_user_id, peer_id),
        FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE keywords_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('include', 'exclude')),
        value TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        UNIQUE(owner_user_id, type, value),
        FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE raw_messages_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER NOT NULL,
        source_peer_id TEXT NOT NULL,
        telegram_message_id INTEGER NOT NULL,
        channel_username TEXT,
        channel_title TEXT,
        text TEXT NOT NULL,
        message_date TEXT,
        permalink TEXT,
        hash TEXT NOT NULL,
        matched INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        UNIQUE(owner_user_id, source_peer_id, telegram_message_id),
        FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE matches_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_user_id INTEGER NOT NULL,
        raw_message_id INTEGER NOT NULL UNIQUE,
        matched_keywords TEXT NOT NULL,
        forwarded_at TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(raw_message_id) REFERENCES raw_messages_v2(id) ON DELETE CASCADE
      );
    `);

    seedDefaultUser();

    const ownerUserIdRow = db.query("SELECT id FROM users WHERE telegram_user_id = ?1").get(defaultOwnerTelegramUserId) as { id: number } | null;
    const ownerUserId = ownerUserIdRow?.id ?? 0;

    db.query(
      `INSERT INTO channels_v2 (id, owner_user_id, peer_id, username, title, access_hash, enabled, created_at, updated_at)
       SELECT id, ?1, peer_id, username, title, access_hash, enabled, created_at, updated_at FROM channels`
    ).run(ownerUserId);

    db.query(
      `INSERT INTO keywords_v2 (id, owner_user_id, type, value, enabled, created_at)
       SELECT id, ?1, type, value, enabled, created_at FROM keywords`
    ).run(ownerUserId);

    db.query(
      `INSERT INTO raw_messages_v2 (
        id, owner_user_id, source_peer_id, telegram_message_id, channel_username, channel_title, text,
        message_date, permalink, hash, matched, created_at
      )
      SELECT id, ?1, source_peer_id, telegram_message_id, channel_username, channel_title, text,
             message_date, permalink, hash, matched, created_at
      FROM raw_messages`
    ).run(ownerUserId);

    db.query(
      `INSERT INTO matches_v2 (id, owner_user_id, raw_message_id, matched_keywords, forwarded_at, created_at)
       SELECT id, ?1, raw_message_id, matched_keywords, forwarded_at, created_at FROM matches`
    ).run(ownerUserId);

    db.exec(`
      DROP TABLE matches;
      DROP TABLE raw_messages;
      DROP TABLE keywords;
      DROP TABLE channels;
      ALTER TABLE channels_v2 RENAME TO channels;
      ALTER TABLE keywords_v2 RENAME TO keywords;
      ALTER TABLE raw_messages_v2 RENAME TO raw_messages;
      ALTER TABLE matches_v2 RENAME TO matches;
    `);

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};

const migrateLegacyTelegramSession = () => {
  if (!defaultOwnerTelegramUserId) {
    return;
  }

  const apiIdRow = db.query("SELECT value FROM settings WHERE key = 'telegram.apiId'").get() as { value: string } | null;
  const apiHashRow = db.query("SELECT value FROM settings WHERE key = 'telegram.apiHash'").get() as { value: string } | null;
  const sessionRow = db.query("SELECT value FROM settings WHERE key = 'telegram.session'").get() as { value: string } | null;
  const phoneRow = db.query("SELECT value FROM settings WHERE key = 'telegram.phone'").get() as { value: string } | null;

  if (!apiIdRow?.value || !apiHashRow?.value) {
    return;
  }

  const ownerRow = db.query("SELECT id FROM users WHERE telegram_user_id = ?1").get(defaultOwnerTelegramUserId) as { id: number } | null;

  if (!ownerRow) {
    return;
  }

  const existing = db.query("SELECT id FROM telegram_sessions WHERE owner_user_id = ?1").get(ownerRow.id) as { id: number } | null;

  if (existing) {
    return;
  }

  const now = new Date().toISOString();

  db.query(
    `INSERT INTO telegram_sessions (
      owner_user_id, api_id, api_hash, phone_number, session, authorized_at, created_at, updated_at
    ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?6)`
  ).run(ownerRow.id, Number(apiIdRow.value), apiHashRow.value, phoneRow?.value ?? null, sessionRow?.value ?? null, sessionRow?.value ? now : null);
};

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_user_id INTEGER NOT NULL UNIQUE,
    username TEXT,
    first_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS telegram_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id INTEGER NOT NULL UNIQUE,
    api_id INTEGER NOT NULL,
    api_hash TEXT NOT NULL,
    phone_number TEXT,
    session TEXT,
    me_id TEXT,
    me_username TEXT,
    me_first_name TEXT,
    me_last_name TEXT,
    me_phone TEXT,
    authorized_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id INTEGER NOT NULL,
    peer_id TEXT NOT NULL,
    username TEXT,
    title TEXT,
    access_hash TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(owner_user_id, peer_id),
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('include', 'exclude')),
    value TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    UNIQUE(owner_user_id, type, value),
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS raw_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id INTEGER NOT NULL,
    source_peer_id TEXT NOT NULL,
    telegram_message_id INTEGER NOT NULL,
    channel_username TEXT,
    channel_title TEXT,
    text TEXT NOT NULL,
    message_date TEXT,
    permalink TEXT,
    hash TEXT NOT NULL,
    matched INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    UNIQUE(owner_user_id, source_peer_id, telegram_message_id),
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_user_id INTEGER NOT NULL,
    raw_message_id INTEGER NOT NULL UNIQUE,
    matched_keywords TEXT NOT NULL,
    forwarded_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(owner_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(raw_message_id) REFERENCES raw_messages(id) ON DELETE CASCADE
  );
`);

migrateLegacySchema();
migrateLegacyTelegramSession();

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_channels_owner_enabled ON channels(owner_user_id, enabled);
  CREATE INDEX IF NOT EXISTS idx_channels_peer_enabled ON channels(peer_id, enabled);
  CREATE INDEX IF NOT EXISTS idx_keywords_owner_enabled ON keywords(owner_user_id, enabled);
  CREATE INDEX IF NOT EXISTS idx_raw_messages_owner_created ON raw_messages(owner_user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_raw_messages_peer_owner ON raw_messages(source_peer_id, owner_user_id);
  CREATE INDEX IF NOT EXISTS idx_matches_owner_created ON matches(owner_user_id, created_at DESC);
`);

seedDefaultUser();
