-- Fix RLS policy for comments table to allow authenticated users
-- Drop the old strict policy
DROP POLICY IF EXISTS "Authenticated users can create comments" ON complaint_comments;

-- Create new policy that allows any authenticated user to add comments
-- Allow both authenticated users and cases where no user is authenticated (anonymous)
CREATE POLICY "Any user can add comments" ON complaint_comments
  FOR INSERT WITH CHECK (true);

-- Alternatively, if you want to only allow authenticated users:
-- CREATE POLICY "Authenticated users can add comments" ON complaint_comments
--   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
