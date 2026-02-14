-- Auto-approve users when they add their own API keys (BYOK)
-- This allows users to bypass the approval process by providing their own credits

CREATE OR REPLACE FUNCTION auto_approve_byok_users()
RETURNS TRIGGER AS $$
BEGIN
  -- If user adds any API key and status is 'pending', auto-approve them
  IF (
    (NEW.encrypted_openai_key IS NOT NULL OR 
     NEW.encrypted_anthropic_key IS NOT NULL OR 
     NEW.encrypted_gemini_key IS NOT NULL)
    AND OLD.status = 'pending'
  ) THEN
    NEW.status = 'approved';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user_profiles UPDATE
CREATE TRIGGER on_user_profile_api_key_added
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_approve_byok_users();

-- Comment
COMMENT ON FUNCTION auto_approve_byok_users IS 'Auto-approves pending users when they add their own API keys (BYOK = auto-approval)';
