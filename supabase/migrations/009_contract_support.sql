-- Allow contract source types
ALTER TABLE analyses DROP CONSTRAINT IF EXISTS analyses_source_type_check;
ALTER TABLE analyses ADD CONSTRAINT analyses_source_type_check 
  CHECK (source_type IN ('upload', 'screen_capture', 'url', 'code', 'github'));

-- Make image_paths optional (for contracts)
ALTER TABLE analyses ALTER COLUMN image_paths DROP NOT NULL;
ALTER TABLE analyses ALTER COLUMN image_paths SET DEFAULT '{}';

-- Add contract-specific columns
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS input_context TEXT;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS repo_info JSONB;
