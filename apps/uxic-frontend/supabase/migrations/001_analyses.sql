-- Main analysis session
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('upload', 'screen_capture', 'url')),
  source_url TEXT,
  image_path TEXT NOT NULL,
  providers_used TEXT[] NOT NULL,
  master_provider TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'step1', 'step2', 'step3', 'completed', 'failed')),
  final_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Every AI response stored separately
CREATE TABLE analysis_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  step TEXT NOT NULL CHECK (step IN ('v1_initial', 'v2_rethink', 'v3_synthesis')),
  result JSONB NOT NULL,
  score INTEGER,
  tokens_used INTEGER DEFAULT 0,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_responses_analysis ON analysis_responses(analysis_id);
CREATE INDEX idx_responses_step ON analysis_responses(analysis_id, step);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX idx_usage_user_date ON usage_tracking(user_id, created_at);

-- RLS for analyses
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own analyses" ON analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own analyses" ON analyses FOR DELETE USING (auth.uid() = user_id);

-- RLS for analysis_responses (via parent analysis)
ALTER TABLE analysis_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own responses" ON analysis_responses FOR SELECT 
  USING (EXISTS (SELECT 1 FROM analyses WHERE analyses.id = analysis_id AND analyses.user_id = auth.uid()));

-- RLS for usage_tracking
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON usage_tracking FOR SELECT USING (auth.uid() = user_id);
