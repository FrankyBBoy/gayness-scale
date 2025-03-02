-- Migration: Remove daily votes count

-- SQLite doesn't support DROP COLUMN directly, so we need to:
-- 1. Create a new table without the column
-- 2. Copy data from the old table
-- 3. Drop the old table
-- 4. Rename the new table

-- Create new table without daily_votes_count
CREATE TABLE IF NOT EXISTS users_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  daily_suggestions_count INTEGER DEFAULT 0,
  last_vote_date TEXT,
  last_suggestion_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Copy data from old table to new table
INSERT INTO users_new (id, email, name, daily_suggestions_count, last_vote_date, last_suggestion_date, created_at, updated_at)
SELECT id, email, name, daily_suggestions_count, last_vote_date, last_suggestion_date, created_at, updated_at
FROM users;

-- Drop old table
DROP TABLE IF EXISTS users;

-- Rename new table to original name
ALTER TABLE users_new RENAME TO users; 