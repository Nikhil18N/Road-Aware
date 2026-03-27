-- Migration to support 'in_progress' status for worker tasks
-- This allows workers to mark a complaint as being worked on

ALTER TABLE complaints 
DROP CONSTRAINT IF EXISTS complaints_status_check;

ALTER TABLE complaints 
ADD CONSTRAINT complaints_status_check 
CHECK (status IN ('processing', 'analyzed', 'failed', 'pending', 'in_progress', 'resolved'));
