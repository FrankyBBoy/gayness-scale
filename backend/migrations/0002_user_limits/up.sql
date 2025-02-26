-- Add daily limits to users table
ALTER TABLE users
ADD COLUMN daily_votes_count INTEGER DEFAULT 0,
ADD COLUMN daily_suggestions_count INTEGER DEFAULT 0,
ADD COLUMN last_vote_date DATE,
ADD COLUMN last_suggestion_date DATE;

-- Add ELO score to suggestions table
ALTER TABLE suggestions
ADD COLUMN elo_score INTEGER DEFAULT 1500; 