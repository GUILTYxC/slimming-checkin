const Database = require('better-sqlite3')
const path = require('path')

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'slimming.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    local_id INTEGER,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    total_days INTEGER NOT NULL,
    initial_weight REAL,
    target_weight REAL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS daily_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    period_id INTEGER NOT NULL,
    local_id INTEGER,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS day_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    period_id INTEGER NOT NULL,
    local_id INTEGER,
    date TEXT NOT NULL,
    weight REAL,
    calories_burned REAL,
    activities TEXT DEFAULT '{}',
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
    UNIQUE(user_id, period_id, date)
  );

  CREATE TABLE IF NOT EXISTS weekly_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    period_id INTEGER NOT NULL,
    local_id INTEGER,
    week_number INTEGER NOT NULL,
    start_date TEXT,
    end_date TEXT,
    summary TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
    UNIQUE(user_id, period_id, week_number)
  );

  CREATE INDEX IF NOT EXISTS idx_periods_user ON periods(user_id);
  CREATE INDEX IF NOT EXISTS idx_activities_period ON daily_activities(period_id);
  CREATE INDEX IF NOT EXISTS idx_records_period_date ON day_records(period_id, date);
  CREATE INDEX IF NOT EXISTS idx_summaries_period ON weekly_summaries(period_id);
`)

module.exports = db