-- Migration: Add contact fields to complaints table
-- Date: 2026-03-22
-- Description: Add optional contact information fields (name, phone, email) to support anonymous and tracked submissions

-- Add contact information columns to complaints table
ALTER TABLE complaints
ADD COLUMN IF NOT EXISTS reporter_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS reporter_phone VARCHAR(15),
ADD COLUMN IF NOT EXISTS reporter_email VARCHAR(255);

-- Add indexes for faster lookups when tracking complaints by phone/email
CREATE INDEX IF NOT EXISTS idx_complaints_reporter_phone ON complaints(reporter_phone) WHERE reporter_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_complaints_reporter_email ON complaints(reporter_email) WHERE reporter_email IS NOT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN complaints.reporter_name IS 'Optional: Name of person reporting the complaint';
COMMENT ON COLUMN complaints.reporter_phone IS 'Optional: Phone number for SMS updates and verification';
COMMENT ON COLUMN complaints.reporter_email IS 'Optional: Email for email updates and verification';
