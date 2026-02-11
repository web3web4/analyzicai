-- Migration: Allow decimal scores instead of integers
-- AI providers sometimes return scores like 86.5

-- Change final_score in analyses table to NUMERIC(5,2) 
-- This allows scores like 86.50, max 999.99
ALTER TABLE analyses 
  ALTER COLUMN final_score TYPE NUMERIC(5,2);

-- Change score in analysis_responses table to NUMERIC(5,2)
ALTER TABLE analysis_responses
  ALTER COLUMN score TYPE NUMERIC(5,2);

-- Add comment for clarity
COMMENT ON COLUMN analyses.final_score IS 'Final analysis score (0-100), stored as decimal but typically displayed as integer';
COMMENT ON COLUMN analysis_responses.score IS 'Provider response score (0-100), stored as decimal but typically displayed as integer';
