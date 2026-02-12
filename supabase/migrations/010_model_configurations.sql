-- Model configurations table
-- Stores AI model names for each provider and tier
CREATE TABLE model_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'gemini', 'anthropic')),
  tier TEXT NOT NULL CHECK (tier IN ('tier1', 'tier2', 'tier3')),
  model_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, tier)
);

-- Seed initial model configurations
INSERT INTO model_configurations (provider, tier, model_name, description) VALUES
  -- OpenAI Models
  ('openai', 'tier1', 'gpt-5-nano', 'Cheapest - fastest and most affordable'),
  ('openai', 'tier2', 'gpt-5-mini', 'Balanced - best cost-to-quality ratio'),
  ('openai', 'tier3', 'gpt-5.2-pro', 'Premium - highest quality outcomes'),
  
  -- Anthropic Models
  ('anthropic', 'tier1', 'claude-haiku-4-5-20251001', 'Cheapest - fastest and most affordable'),
  ('anthropic', 'tier2', 'claude-sonnet-4-5-20250929', 'Balanced - best cost-to-quality ratio'),
  ('anthropic', 'tier3', 'claude-opus-4-6', 'Premium - highest quality outcomes'),
  
  -- Gemini Models
  ('gemini', 'tier1', 'gemini-2.0-flash-lite', 'Cheapest - fastest and most affordable'),
  ('gemini', 'tier2', 'gemini-2.5-flash', 'Balanced - best cost-to-quality ratio'),
  ('gemini', 'tier3', 'gemini-3-pro-preview', 'Premium - highest quality outcomes');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_model_configurations_updated_at
  BEFORE UPDATE ON model_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS for model_configurations (public read, admin write)
ALTER TABLE model_configurations ENABLE ROW LEVEL SECURITY;

-- Anyone can read model configurations
CREATE POLICY "Anyone can view active model configurations" 
  ON model_configurations FOR SELECT 
  USING (is_active = true);

-- Only service role can insert/update/delete (via admin API)
CREATE POLICY "Service role can manage model configurations" 
  ON model_configurations FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- Index for fast lookups
CREATE INDEX idx_model_configs_provider_tier ON model_configurations(provider, tier) WHERE is_active = true;
CREATE INDEX idx_model_configs_active ON model_configurations(is_active);
