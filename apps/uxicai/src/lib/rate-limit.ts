import { createServiceClient } from "@/lib/supabase/server";

// TODO: Implement proper subscription tiers with different limits
// For now, using a high limit for testing/development
const DAILY_LIMIT = 1000; // analyses per day (temporary high limit for testing)

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const supabase = createServiceClient();

  // Get start of current day in UTC
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);

  // Tomorrow at start of day for reset
  const resetAt = new Date(startOfDay);
  resetAt.setUTCDate(resetAt.getUTCDate() + 1);

  // Count analyses today
  const { count, error } = await supabase
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfDay.toISOString());

  if (error) {
    console.error("Rate limit check error:", error);
    // Fail open - allow the request if we can't check
    return { allowed: true, remaining: DAILY_LIMIT, resetAt };
  }

  const usedToday = count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - usedToday);

  return {
    allowed: remaining > 0,
    remaining,
    resetAt,
  };
}
