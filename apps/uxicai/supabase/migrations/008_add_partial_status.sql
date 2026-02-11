-- Add 'partial' status to the analyses status constraint
-- This allows analyses to be marked as partial when some providers fail but others succeed

-- Drop the existing constraint
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS analyses_status_check;

-- Add new constraint with 'partial' included
ALTER TABLE analyses ADD CONSTRAINT analyses_status_check 
  CHECK (status IN ('pending', 'step1', 'step2', 'step3', 'completed', 'failed', 'partial'));
