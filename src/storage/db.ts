import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { Database } from "bun:sqlite";

import { env } from "../config/env";

const databasePath = resolve(env.databasePath);

mkdirSync(dirname(databasePath), { recursive: true });

export const db = new Database(databasePath, { create: true, strict: true });

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    peer_id TEXT NOT NULL UNIQUE,
    username TEXT,
    title TEXT,
    access_hash TEXT,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK (type IN ('include', 'exclude')),
    value TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    UNIQUE(type, value)
  );

  CREATE TABLE IF NOT EXISTS raw_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    UNIQUE(source_peer_id, telegram_message_id)
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_message_id INTEGER NOT NULL UNIQUE,
    matched_keywords TEXT NOT NULL,
    forwarded_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(raw_message_id) REFERENCES raw_messages(id) ON DELETE CASCADE
  );
`);
