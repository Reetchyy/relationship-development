-- Fix RLS policies for cultural_quiz_results table
-- Run this in your Supabase SQL editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own quiz results" ON cultural_quiz_results;
DROP POLICY IF EXISTS "Users can insert own quiz results" ON cultural_quiz_results;
DROP POLICY IF EXISTS "Users can insert own activities" ON user_activities;

-- Create RLS policies for cultural_quiz_results
CREATE POLICY "Users can view own quiz results"
  ON cultural_quiz_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON cultural_quiz_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_activities
CREATE POLICY "Users can insert own activities"
  ON user_activities
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('cultural_quiz_results', 'user_activities'); 