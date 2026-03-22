-- Migration to support 'Critical' severity level
-- Run this in Supabase SQL Editor

ALTER TABLE complaints 
DROP CONSTRAINT IF EXISTS complaints_severity_check;

ALTER TABLE complaints 
ADD CONSTRAINT complaints_severity_check 
CHECK (severity IN ('Low', 'Medium', 'High', 'Critical'));
