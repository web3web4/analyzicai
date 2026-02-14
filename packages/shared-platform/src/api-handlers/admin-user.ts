import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "../supabase/server";
import { requireAdmin } from "../auth/admin";
import { checkAdminRateLimit } from "../auth/admin-rate-limit";
import {
  handleApiError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "../utils/errors";
import { z } from "zod";

const updateSchema = z.object({
  status: z.enum(["pending", "approved", "suspended"]).optional(),
  subscriptionTier: z.enum(["free", "pro", "enterprise"]).optional(),
  dailyTokenLimit: z.number().int().min(0).nullable().optional(),
  isAdmin: z.boolean().optional(),
});

export async function handleAdminUserUpdate(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
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
    await checkAdminRateLimit(user.id, "update");

    const { userId } = await params;
    const body = await request.json();

    // Validate request body
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError(
        "Invalid request data",
        JSON.stringify(result.error.issues),
      );
    }

    const updates = result.data;

    // Use service client to update user profile
    const serviceSupabase = createServiceClient();

    const { data, error } = await serviceSupabase
      .from("user_profiles")
      .update({
        ...(updates.status && { status: updates.status }),
        ...(updates.subscriptionTier && {
          subscription_tier: updates.subscriptionTier,
        }),
        ...(updates.dailyTokenLimit !== undefined && {
          daily_token_limit: updates.dailyTokenLimit,
        }),
        ...(updates.isAdmin !== undefined && { is_admin: updates.isAdmin }),
      })
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        userId: data.user_id,
        status: data.status,
        subscriptionTier: data.subscription_tier,
        dailyTokenLimit: data.daily_token_limit,
        isAdmin: data.is_admin,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function handleAdminUserGet(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
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
    await checkAdminRateLimit(user.id, "get");

    const { userId } = await params;

    // Use service client to fetch user details
    const serviceSupabase = createServiceClient();

    const { data: profile, error: profileError } = await serviceSupabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      throw new NotFoundError("User");
    }

    // Get email from auth.users
    const { data: authUser, error: authUserError } =
      await serviceSupabase.auth.admin.getUserById(userId);

    if (authUserError || !authUser.user) {
      throw new NotFoundError("User");
    }

    // Get usage statistics
    const { count: analysisCount } = await serviceSupabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const { count: todayCount } = await serviceSupabase
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte(
        "created_at",
        new Date(new Date().setHours(0, 0, 0, 0)).toISOString(),
      );

    return NextResponse.json({
      userId: profile.user_id,
      email: authUser.user.email || "N/A",
      lastSignIn: authUser.user.last_sign_in_at || null,
      status: profile.status,
      subscriptionTier: profile.subscription_tier,
      dailyTokenLimit: profile.daily_token_limit,
      isAdmin: profile.is_admin,
      hasApiKeys: {
        openai: !!profile.encrypted_openai_key,
        anthropic: !!profile.encrypted_anthropic_key,
        gemini: !!profile.encrypted_gemini_key,
      },
      usage: {
        totalAnalyses: analysisCount || 0,
        todayAnalyses: todayCount || 0,
      },
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
