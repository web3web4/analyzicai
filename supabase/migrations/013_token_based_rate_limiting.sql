-- Migration: Token-Based Rate Limiting
-- Changes rate limiting from analysis count to token consumption
-- This provides more granular cost control and fairer usage limits

-- Rename daily_rate_limit to daily_token_limit for clarity
ALTER TABLE user_profiles 
  RENAME COLUMN daily_rate_limit TO daily_token_limit;

-- Add comment explaining the new token-based system
COMMENT ON COLUMN user_profiles.daily_token_limit IS 
  'Custom daily token limit for this user (overrides tier default). NULL means use tier default. Tokens are summed from analysis_responses table.';

-- Update default tier token limits (these are just documentation, actual limits are in app code)
COMMENT ON COLUMN user_profiles.subscription_tier IS 
  'Subscription tier with default token limits: free=50000, pro=1000000, enterprise=10000000 tokens/day';
