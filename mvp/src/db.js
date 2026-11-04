// src/db.js
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('./config');

const dir = path.dirname(config.dbPath);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const db = new DatabaseSync(config.dbPath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS instances (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  adb_serial TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unknown',
  paused INTEGER NOT NULL DEFAULT 0,
  last_seen_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('out','in')),
  to_number TEXT,
  from_number TEXT,
  body TEXT,
  media_path TEXT,
  media_type TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  observed_status TEXT,
  idempotency_key TEXT,
  correlation_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (instance_id) REFERENCES instances(id)
);
CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  result TEXT,
  error TEXT,
  idempotency_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (instance_id) REFERENCES instances(id)
);
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  type TEXT NOT NULL,
  payload TEXT NOT NULL,
  webhook_status TEXT NOT NULL DEFAULT 'pending',
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (instance_id) REFERENCES instances(id)
);
CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  secret TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_instance ON messages(instance_id);
CREATE INDEX IF NOT EXISTS idx_commands_status ON commands(status);
CREATE INDEX IF NOT EXISTS idx_events_instance ON events(instance_id);
`);

function now() { return new Date().toISOString(); }

module.exports = { db, now };
