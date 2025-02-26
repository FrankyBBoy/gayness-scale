-- Remove title and status columns from suggestions table
ALTER TABLE suggestions DROP COLUMN title;
ALTER TABLE suggestions DROP COLUMN status; 