-- Migration: Initial schema
-- Created at: 2024-02-26 16:10:00

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    daily_suggestions_count INTEGER DEFAULT 0,
    last_suggestion_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Suggestions table
CREATE TABLE IF NOT EXISTS suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    user_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    elo_score INTEGER DEFAULT 1500,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    suggestion_id INTEGER NOT NULL,
    score INTEGER NOT NULL CHECK(score >= 1 AND score <= 5),
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (suggestion_id) REFERENCES suggestions (id),
    UNIQUE(user_id, suggestion_id)
); 