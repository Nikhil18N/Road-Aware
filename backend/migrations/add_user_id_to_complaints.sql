-- Link Complaints to Users

ALTER TABLE complaints 
ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add index for faster lookup of user's complaints
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
