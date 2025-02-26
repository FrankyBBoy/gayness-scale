-- Migration: Add user name
-- Created at: 2024-02-26 17:30:00

-- Add name column to users table
ALTER TABLE users
ADD COLUMN name TEXT; 