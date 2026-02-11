-- Add missing INSERT policy for analysis_responses table
-- This allows the API to insert analysis results from AI providers

ALTER TABLE analysis_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert responses for own analyses" ON analysis_responses FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM analyses 
    WHERE analyses.id = analysis_id 
    AND analyses.user_id = auth.uid()
  ));
