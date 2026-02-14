import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "../supabase/server";
import { requireAdmin } from "../auth/admin";
import { checkAdminRateLimit } from "../auth/admin-rate-limit";
import { handleApiError, AuthenticationError } from "../utils/errors";
import { z } from "zod";

const querySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20)),
  status: z.enum(["approved", "suspended"]).optional(),
  search: z.string().optional(),
});

export async function handleAdminUsersList(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new AuthenticationError();
    }

    // Check admin permission
    await requireAdmin(user.id);

    // Check rate limit
    await checkAdminRateLimit(user.id, "list");

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    const { page, limit, status, search } = query;
    const offset = (page - 1) * limit;

    // Enforce max page size
    const MAX_PAGE_SIZE = 100;
    const safeLimit = Math.min(limit, MAX_PAGE_SIZE);

    // Build query
    const serviceSupabase = createServiceClient();
    let queryBuilder = serviceSupabase.from("user_profiles").select(
      `
      user_id,
      status,
      subscription_tier,
      daily_token_limit,
      is_admin,
      encrypted_openai_key,
      encrypted_anthropic_key,
      encrypted_gemini_key,
      created_at,
      updated_at
    `,
      { count: "exact" },
    );

    // Apply filters
    if (status) {
      queryBuilder = queryBuilder.eq("status", status);
    }

    if (search) {
      // Validate UUID format for exact match
      const UUID_REGEX =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (UUID_REGEX.test(search)) {
        queryBuilder = queryBuilder.eq("user_id", search);
      } else {
        // Invalid UUID - return no results
        queryBuilder = queryBuilder.eq(
          "user_id",
          "00000000-0000-0000-0000-000000000000",
        );
      }
    }

    // Apply pagination with enforced limit
    queryBuilder = queryBuilder
      .range(offset, offset + safeLimit - 1)
      .limit(safeLimit)
      .order("created_at", { ascending: false });

    const { data: users, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    // Get email addresses from auth.users for display
    const userIds = users?.map((u) => u.user_id) || [];
    const { data: authUsers } = await serviceSupabase.auth.admin.listUsers();

    const userEmailMap = new Map<
      string,
      { email: string; lastSignIn: string | null }
    >();
    authUsers?.users.forEach((u) => {
      if (userIds.includes(u.id)) {
        userEmailMap.set(u.id, {
          email: u.email || "N/A",
          lastSignIn: u.last_sign_in_at || null,
        });
      }
    });

    // Enhance user data with emails and key info
    const enhancedUsers = users?.map((user) => ({
      userId: user.user_id,
      email: userEmailMap.get(user.user_id)?.email || "N/A",
      lastSignIn: userEmailMap.get(user.user_id)?.lastSignIn || null,
      status: user.status,
      subscriptionTier: user.subscription_tier,
      dailyTokenLimit: user.daily_token_limit,
      isAdmin: user.is_admin,
      hasApiKeys: {
        openai: !!user.encrypted_openai_key,
        anthropic: !!user.encrypted_anthropic_key,
        gemini: !!user.encrypted_gemini_key,
      },
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));

    return NextResponse.json({
      users: enhancedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
