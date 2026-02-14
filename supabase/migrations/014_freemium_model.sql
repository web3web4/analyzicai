-- Migration: Switch to freemium model
-- New users are auto-approved, blocked only if they don't have API keys

-- 1. Change default status from 'pending' to 'approved'
ALTER TABLE user_profiles 
  ALTER COLUMN status SET DEFAULT 'approved';

-- 2. Update existing 'pending' users to 'approved'
UPDATE user_profiles 
SET status = 'approved' 
WHERE status = 'pending';

-- 3. Create subscription waitlist table
CREATE TABLE subscription_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  interested_plan TEXT CHECK (interested_plan IN ('starter', 'pro', 'enterprise')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

CREATE INDEX idx_waitlist_user_id ON subscription_waitlist(user_id);
CREATE INDEX idx_waitlist_created_at ON subscription_waitlist(created_at DESC);
CREATE INDEX idx_waitlist_notified ON subscription_waitlist(notified_at) WHERE notified_at IS NULL;

ALTER TABLE subscription_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own waitlist entry"
  ON subscription_waitlist FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waitlist entry"
  ON subscription_waitlist FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waitlist entry"
  ON subscription_waitlist FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to waitlist"
  ON subscription_waitlist FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

COMMENT ON TABLE subscription_waitlist IS 'Users interested in future subscription plans';