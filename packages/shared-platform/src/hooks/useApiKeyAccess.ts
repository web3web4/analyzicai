"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "../supabase/client";

export interface ApiKeyAccessResult {
  hasAccess: boolean;
  isLoading: boolean;
  reason?: "api_keys" | "admin" | "subscription" | "none";
}

/**
 * Custom hook to check if user has access to analyze features.
 *
 * User has access if ANY of these conditions are met:
 * 1. Has at least one encrypted API key (BYOK - unlimited)
 * 2. Has allocated tokens (from tier OR through custom admin assignment)
 *
 * Note: Admin status is separate and only grants user management capabilities.
 * Admins should be assigned "pro" tier initially for analysis access. But they can also edit their token limits.
 *
 * @returns {ApiKeyAccessResult} Access state and loading status
 */
export function useApiKeyAccess(): ApiKeyAccessResult {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reason, setReason] = useState<ApiKeyAccessResult["reason"]>("none");

  useEffect(() => {
    async function checkAccess() {
      const supabase = createBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setHasAccess(false);
        setReason("none");
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("user_profiles")
        .select(
          "encrypted_openai_key, encrypted_anthropic_key, encrypted_gemini_key, subscription_tier, daily_token_limit",
        )
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        setHasAccess(false);
        setReason("none");
        setIsLoading(false);
        return;
      }

      // Check 1: Has at least one API key? (BYOK - unlimited access)
      const hasApiKeys = !!(
        profile.encrypted_openai_key ||
        profile.encrypted_anthropic_key ||
        profile.encrypted_gemini_key
      );

      if (hasApiKeys) {
        setHasAccess(true);
        setReason("api_keys");
        setIsLoading(false);
        return;
      }

      // Check 2: Has allocated tokens? (from tier OR custom admin assignment)
      // Token limits by tier: free=0, pro=1M, enterprise=10M
      const tierTokens: Record<string, number> = {
        free: 0,
        pro: 1_000_000,
        enterprise: 10_000_000,
      };

      const allocatedTokens =
        profile.daily_token_limit ?? tierTokens[profile.subscription_tier] ?? 0;

      if (allocatedTokens > 0) {
        setHasAccess(true);
        setReason("subscription");
        setIsLoading(false);
        return;
      }

      // No access
      setHasAccess(false);
      setReason("none");
      setIsLoading(false);
    }

    checkAccess();
  }, []);

  return { hasAccess, isLoading, reason };
}
