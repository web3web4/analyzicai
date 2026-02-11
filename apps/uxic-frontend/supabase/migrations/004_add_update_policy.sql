-- Add missing UPDATE policy for analyses table
-- This allows users to update their own analysis records (e.g., status, final_score)

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can update own analyses" ON analyses FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
