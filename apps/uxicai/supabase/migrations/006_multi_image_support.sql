-- Migration: Add multi-image support to analyses table
-- This migration changes image_path (single TEXT) to image_paths (TEXT array)

-- Step 1: Add new columns
ALTER TABLE analyses 
  ADD COLUMN IF NOT EXISTS image_paths TEXT[] DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_count INTEGER DEFAULT 1;

-- Step 2: Migrate existing data - convert single image_path to array
UPDATE analyses 
  SET image_paths = ARRAY[image_path], 
      image_count = 1 
  WHERE image_paths IS NULL AND image_path IS NOT NULL;

-- Step 3: Make image_paths required (after data migration)
ALTER TABLE analyses 
  ALTER COLUMN image_paths SET NOT NULL;

-- Step 4: Drop the old image_path column
ALTER TABLE analyses 
  DROP COLUMN IF EXISTS image_path;

-- Step 5: Add column to analysis_responses to track which image(s) a response applies to
-- NULL means applies to all images (for overall analysis)
ALTER TABLE analysis_responses
  ADD COLUMN IF NOT EXISTS image_indices INTEGER[] DEFAULT NULL;

-- Step 6: Add index for image_count queries (useful for filtering multi-image analyses)
CREATE INDEX IF NOT EXISTS idx_analyses_image_count ON analyses(image_count);
