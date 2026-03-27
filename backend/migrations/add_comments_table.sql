-- Create comments table
CREATE TABLE IF NOT EXISTS complaint_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comments for a complaint" ON complaint_comments
  FOR SELECT USING (true);

-- Assuming any logged in user can add comments
CREATE POLICY "Authenticated users can create comments" ON complaint_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
