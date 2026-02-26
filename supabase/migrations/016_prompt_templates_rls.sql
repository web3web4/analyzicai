-- Enable RLS on prompt_templates
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read prompt templates (used by AI pipeline server-side)
CREATE POLICY "prompt_templates_select_authenticated"
  ON prompt_templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Service role bypasses RLS automatically — no INSERT/UPDATE/DELETE policies needed for app users
