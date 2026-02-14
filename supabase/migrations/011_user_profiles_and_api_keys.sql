-- Create user_profiles table with API keys, subscription tiers, and admin status
-- This table stores user-specific settings, rate limits, and encrypted API keys

-- Create ENUM types
CREATE TYPE user_status AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');

-- Create user_profiles table
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status user_status NOT NULL DEFAULT 'pending',
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  daily_rate_limit INTEGER, -- NULL means use tier default
  is_admin BOOLEAN NOT NULL DEFAULT false,
  encrypted_openai_key TEXT,
  encrypted_anthropic_key TEXT,
  encrypted_gemini_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index on status for admin queries
CREATE INDEX idx_user_profiles_status ON user_profiles(status);

-- Add index on is_admin for quick admin checks
CREATE INDEX idx_user_profiles_is_admin ON user_profiles(is_admin) WHERE is_admin = true;

-- Add index on user_id for lookups
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own profile (API keys, not status/tier/admin)
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Users cannot change their own status, tier, rate_limit, or admin status
    AND (
      (status IS NOT DISTINCT FROM (SELECT status FROM user_profiles WHERE user_id = auth.uid()))
      AND (subscription_tier IS NOT DISTINCT FROM (SELECT subscription_tier FROM user_profiles WHERE user_id = auth.uid()))
      AND (daily_rate_limit IS NOT DISTINCT FROM (SELECT daily_rate_limit FROM user_profiles WHERE user_id = auth.uid()))
      AND (is_admin IS NOT DISTINCT FROM (SELECT is_admin FROM user_profiles WHERE user_id = auth.uid()))
    )
  );

-- Policy: Service role has full access (for admin operations and auto-creation)
CREATE POLICY "Service role has full access"
  ON user_profiles
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp;

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_updated_at();

-- Backfill existing users with 'approved' status (grandfather them in)
INSERT INTO user_profiles (user_id, status, subscription_tier, is_admin)
SELECT 
  id as user_id,
  'approved' as status,
  'free' as subscription_tier,
  false as is_admin
FROM auth.users
ON CONFLICT (user_id) DO UPDATE
SET status = 'approved'
WHERE user_profiles.status = 'pending';

-- Comment describing the table
COMMENT ON TABLE user_profiles IS 'User profiles with subscription tiers, rate limits, admin status, and encrypted API keys';
COMMENT ON COLUMN user_profiles.status IS 'Account status: pending (awaiting approval), approved, or suspended';
COMMENT ON COLUMN user_profiles.subscription_tier IS 'Subscription tier determining rate limits and features';
COMMENT ON COLUMN user_profiles.daily_rate_limit IS 'Custom rate limit override (NULL = use tier default)';
COMMENT ON COLUMN user_profiles.is_admin IS 'Whether user has admin privileges';
COMMENT ON COLUMN user_profiles.encrypted_openai_key IS 'Encrypted OpenAI API key (BYOK)';
COMMENT ON COLUMN user_profiles.encrypted_anthropic_key IS 'Encrypted Anthropic API key (BYOK)';
COMMENT ON COLUMN user_profiles.encrypted_gemini_key IS 'Encrypted Gemini API key (BYOK)';
