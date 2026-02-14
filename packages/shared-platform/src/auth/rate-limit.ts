import { createServiceClient } from "../supabase/server";

// Token-based rate limit tiers (more granular cost control)
const TIER_TOKEN_LIMITS = {
  free: 50_000, // ~10-25 basic analyses/day
  pro: 1_000_000, // ~200-500 analyses/day
  enterprise: 10_000_000, // ~2000-5000 analyses/day
} as const;

const DEFAULT_TOKEN_LIMIT = TIER_TOKEN_LIMITS.free;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number; // tokens remaining
  resetAt: Date;
  limit: number; // total token limit
  used: number; // tokens used today
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  // Bypass rate limiting in development if ENABLE_RATE_LIMITS is false
  if (process.env.ENABLE_RATE_LIMITS === "false") {
    const resetAt = new Date();
    resetAt.setUTCDate(resetAt.getUTCDate() + 1);
    return {
      allowed: true,
      remaining: 999999,
      resetAt,
      limit: 999999,
      used: 0,
    };
  }

  const supabase = createServiceClient();

  // Get start of current day in UTC
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  // Tomorrow at start of day for reset
  const resetAt = new Date(startOfDay);
  resetAt.setUTCDate(resetAt.getUTCDate() + 1);

  try {
    // Fetch user profile to check subscription tier and API keys
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select(
        "subscription_tier, daily_token_limit, encrypted_openai_key, encrypted_anthropic_key, encrypted_gemini_key",
      )
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      // Default to free tier if profile not found
      return {
        allowed: true,
        remaining: DEFAULT_TOKEN_LIMIT,
        resetAt,
        limit: DEFAULT_TOKEN_LIMIT,
        used: 0,
      };
    }

    // BYOK users get unlimited access (they're using their own API credits)
    const hasByokKeys = !!(
      profile.encrypted_openai_key ||
      profile.encrypted_anthropic_key ||
      profile.encrypted_gemini_key
    );

    if (hasByokKeys) {
      return {
        allowed: true,
        remaining: 999999,
        resetAt,
        limit: 999999,
        used: 0,
      };
    }

    // Determine token limit: custom limit > tier limit > default limit
    const limit =
      profile.daily_token_limit ??
      TIER_TOKEN_LIMITS[
        profile.subscription_tier as keyof typeof TIER_TOKEN_LIMITS
      ] ??
      DEFAULT_TOKEN_LIMIT;

    // Sum tokens used today from analysis_responses
    // We need to join with analyses to filter by user_id
    const { data: tokenData, error } = await supabase
      .from("analysis_responses")
      .select("tokens_used, analysis_id")
      .gte("created_at", startOfDay.toISOString());

    if (error) {
      console.error("Rate limit check error:", error);
      // Fail open - allow the request if we can't check
      return { allowed: true, remaining: limit, resetAt, limit, used: 0 };
    }

    // Get all user's analyses created today to filter responses
    const { data: userAnalyses } = await supabase
      .from("analyses")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", startOfDay.toISOString());

    const userAnalysisIds = new Set(userAnalyses?.map((a) => a.id) || []);

    // Sum tokens from user's analyses only
    const tokensUsedToday =
      tokenData
        ?.filter((r) => userAnalysisIds.has(r.analysis_id))
        .reduce((sum, r) => sum + (r.tokens_used || 0), 0) || 0;

    const remaining = Math.max(0, limit - tokensUsedToday);

    return {
      allowed: remaining > 0,
      remaining,
      resetAt,
      limit,
      used: tokensUsedToday,
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    // Fail open on error
    const defaultResetAt = new Date();
    defaultResetAt.setUTCDate(defaultResetAt.getUTCDate() + 1);
    return {
      allowed: true,
      remaining: DEFAULT_TOKEN_LIMIT,
      resetAt: defaultResetAt,
      limit: DEFAULT_TOKEN_LIMIT,
      used: 0,
    };
  }
}
