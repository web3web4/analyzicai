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
 * 1. Has at least one encrypted API key
 * 2. Is an admin
 * 3. Has an active paid subscription (pro or enterprise)
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
          "encrypted_openai_key, encrypted_anthropic_key, encrypted_gemini_key, is_admin, subscription_tier",
        )
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        setHasAccess(false);
        setReason("none");
        setIsLoading(false);
        return;
      }

      // Check 1: Is admin?
      if (profile.is_admin) {
        setHasAccess(true);
        setReason("admin");
        setIsLoading(false);
        return;
      }

      // Check 2: Has paid subscription?
      if (
        profile.subscription_tier === "pro" ||
        profile.subscription_tier === "enterprise"
      ) {
        setHasAccess(true);
        setReason("subscription");
        setIsLoading(false);
        return;
      }

      // Check 3: Has at least one API key?
      const hasApiKeys = !!(
        profile.encrypted_openai_key ||
        profile.encrypted_anthropic_key ||
        profile.encrypted_gemini_key
      );

      if (hasApiKeys) {
        setHasAccess(true);
        setReason("api_keys");
      } else {
        setHasAccess(false);
        setReason("none");
      }

      setIsLoading(false);
    }

    checkAccess();
  }, []);

  return { hasAccess, isLoading, reason };
}
