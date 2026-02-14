/**
 * Admin-specific rate limiting
 * Prevents abuse of admin endpoints
 */

import { RateLimitError } from "../utils/errors";

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  /**
   * Check if a request is allowed under the rate limit
   * @param key - Unique identifier (e.g., userId + action)
   * @param limit - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   */
  async check(key: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this key
    const requests = this.requests.get(key) || [];

    // Filter out requests outside the current window
    const validRequests = requests.filter((time) => time > windowStart);

    // Check if limit exceeded
    if (validRequests.length >= limit) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  /**
   * Clean up expired entries to prevent memory leak
   */
  private cleanup() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter((time) => time > now - maxAge);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }

  /**
   * Clear all rate limit data (useful for testing)
   */
  clear() {
    this.requests.clear();
  }
}

const limiter = new InMemoryRateLimiter();

/**
 * Admin rate limit configurations
 */
const ADMIN_RATE_LIMITS = {
  list: { requests: 60, window: 60 * 1000 }, // 60 requests per minute
  get: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  update: { requests: 30, window: 60 * 1000 }, // 30 requests per minute
  delete: { requests: 10, window: 60 * 1000 }, // 10 requests per minute
} as const;

export type AdminAction = keyof typeof ADMIN_RATE_LIMITS;

/**
 * Check admin rate limit for a specific action
 *
 * Usage:
 * ```ts
 * export async function handleAdminUsersList(request: NextRequest) {
 *   await requireAdmin(user.id);
 *   await checkAdminRateLimit(user.id, "list");
 *   // ... rest of handler
 * }
 * ```
 *
 * @throws RateLimitError if rate limit exceeded
 */
export async function checkAdminRateLimit(
  userId: string,
  action: AdminAction,
): Promise<void> {
  const config = ADMIN_RATE_LIMITS[action];
  const key = `admin:${userId}:${action}`;

  const allowed = await limiter.check(key, config.requests, config.window);

  if (!allowed) {
    const resetAt = new Date(Date.now() + config.window);
    throw new RateLimitError(resetAt);
  }
}

/**
 * Clear admin rate limits (for testing)
 */
export function clearAdminRateLimits() {
  limiter.clear();
}
