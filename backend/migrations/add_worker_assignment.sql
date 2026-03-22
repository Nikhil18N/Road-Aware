-- Add assigned_to column for worker assignment

ALTER TABLE complaints 
ADD COLUMN assigned_to UUID REFERENCES auth.users(id);

-- Add index for faster lookup of worker assignments
CREATE INDEX idx_complaints_assigned_to ON complaints(assigned_to);