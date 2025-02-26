-- Migration: Vote limits
-- Created at: 2024-02-26 16:20:00

-- Add daily vote limits to users table
ALTER TABLE users
ADD COLUMN daily_votes_count INTEGER DEFAULT 0;

ALTER TABLE users
ADD COLUMN last_vote_date DATE; 