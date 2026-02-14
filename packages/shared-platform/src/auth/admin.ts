/**
 * Admin utilities for checking admin status and bootstrapping admins from environment
 */

import { createServiceClient } from "../supabase/server";

/**
 * Check if a user is an admin
 * @param userId - The user ID to check
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createServiceClient();

    const { data: profile, error } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return profile?.is_admin ?? false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Require admin access - throws 403 if user is not admin
 * Use this in API routes to protect admin endpoints
 *
 * @param userId - The user ID to check
 * @throws Response with 403 status if not admin
 */
export async function requireAdmin(userId: string): Promise<void> {
  const isUserAdmin = await isAdmin(userId);

  if (!isUserAdmin) {
    throw new Response(
      JSON.stringify({ error: "Forbidden - Admin access required" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
}

/**
 * Auto-promote users to admin based on ADMIN_EMAILS environment variable
 * Should be called in middleware or login callback
 *
 * @param userEmail - The user's email address
 * @param userId - The user's ID
 * @returns true if user was promoted, false otherwise
 */
export async function promoteAdminsByEmail(
  userEmail: string,
  userId: string,
): Promise<boolean> {
  try {
    // Get admin emails from environment variable
    const adminEmailsEnv = process.env.ADMIN_EMAILS;

    if (!adminEmailsEnv) {
      return false;
    }

    const adminEmails = adminEmailsEnv
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter((email) => email.length > 0);

    // Check if user email is in admin list
    if (!adminEmails.includes(userEmail.toLowerCase())) {
      return false;
    }

    // Check if user is already admin
    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", userId)
      .single();

    // If already admin, no need to update
    if (profile?.is_admin) {
      return false;
    }

    // Promote user to admin
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_admin: true })
      .eq("user_id", userId);

    if (error) {
      console.error("Error promoting user to admin:", error);
      return false;
    }

    console.log(`✅ User ${userEmail} promoted to admin`);
    return true;
  } catch (error) {
    console.error("Error in promoteAdminsByEmail:", error);
    return false;
  }
}

/**
 * Get all admin emails from environment (for display purposes)
 */
export function getAdminEmailsList(): string[] {
  const adminEmailsEnv = process.env.ADMIN_EMAILS;

  if (!adminEmailsEnv) {
    return [];
  }

  return adminEmailsEnv
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}
