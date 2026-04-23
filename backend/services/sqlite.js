import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const isWindows = process.platform === 'win32';
const DB_DIR = isWindows
  ? path.join(process.env.APPDATA || process.env.USERPROFILE || 'C:', 'OnlinePT', 'data')
  : '/var/www/onlinept/data';

fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = path.join(DB_DIR, 'onlinept.db');

let _db = null;

export function getDb() {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clinic_files (
      id          TEXT PRIMARY KEY,
      clinic_id   TEXT NOT NULL,
      file_id     TEXT NOT NULL,
      name        TEXT,
      type        TEXT,
      url         TEXT,
      size        INTEGER,
      tags        TEXT,
      body_part   TEXT,
      uploaded_at TEXT,
      UNIQUE(clinic_id, file_id)
    );

    CREATE TABLE IF NOT EXISTS bundles (
      id              TEXT PRIMARY KEY,
      clinic_id       TEXT NOT NULL,
      name            TEXT,
      description     TEXT,
      condition       TEXT,
      resources       TEXT,
      recommended_sessions INTEGER DEFAULT 4,
      created_at      TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_clinic_files_clinic ON clinic_files(clinic_id);
    CREATE INDEX IF NOT EXISTS idx_clinic_files_type  ON clinic_files(clinic_id, type);
    CREATE INDEX IF NOT EXISTS idx_bundles_clinic      ON bundles(clinic_id);
  `);
}

export default { getDb };
