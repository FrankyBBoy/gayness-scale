-- Add ELO score to suggestions
ALTER TABLE suggestions ADD COLUMN elo_score INTEGER NOT NULL DEFAULT 1500;

-- Drop existing votes table
DROP TABLE IF EXISTS votes;

-- Create new votes table with winner/loser structure
CREATE TABLE votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  winner_id INTEGER NOT NULL,
  loser_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (winner_id) REFERENCES suggestions (id) ON DELETE CASCADE,
  FOREIGN KEY (loser_id) REFERENCES suggestions (id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
); 