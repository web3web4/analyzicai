import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "../supabase/server";
import { encryptApiKey, decryptApiKey, maskApiKey } from "../auth/crypto";
import { z } from "zod";

// Schema for profile update
const updateProfileSchema = z.object({
  openaiKey: z.string().min(1).optional().nullable(),
  anthropicKey: z.string().min(1).optional().nullable(),
  geminiKey: z.string().min(1).optional().nullable(),
});

// GET /api/profile - Fetch user profile
export async function handleProfileGet() {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return NextResponse.json(
        { error: "Failed to fetch profile" },
        { status: 500 },
      );
    }

    // Decrypt and mask API keys for display
    let maskedOpenaiKey = null;
    let maskedAnthropicKey = null;
    let maskedGeminiKey = null;

    try {
      if (profile.encrypted_openai_key) {
        const decrypted = await decryptApiKey(profile.encrypted_openai_key);
        maskedOpenaiKey = maskApiKey(decrypted);
      }
      if (profile.encrypted_anthropic_key) {
        const decrypted = await decryptApiKey(profile.encrypted_anthropic_key);
        maskedAnthropicKey = maskApiKey(decrypted);
      }
      if (profile.encrypted_gemini_key) {
        const decrypted = await decryptApiKey(profile.encrypted_gemini_key);
        maskedGeminiKey = maskApiKey(decrypted);
      }
    } catch (error) {
      console.error("Error decrypting API keys:", error);
      // Continue with null values if decryption fails
    }

    return NextResponse.json({
      userId: profile.user_id,
      status: profile.status,
      subscriptionTier: profile.subscription_tier,
      dailyTokenLimit: profile.daily_token_limit,
      isAdmin: profile.is_admin,
      apiKeys: {
        openai: maskedOpenaiKey,
        anthropic: maskedAnthropicKey,
        gemini: maskedGeminiKey,
      },
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// PATCH /api/profile - Update API keys
export async function handleProfileUpdate(request: Request) {
  try {
    const supabase = await createClient();
    const serviceSupabase = createServiceClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { openaiKey, anthropicKey, geminiKey } = validationResult.data;

    // Prepare update data with encrypted keys
    const updateData: {
      encrypted_openai_key?: string | null;
      encrypted_anthropic_key?: string | null;
      encrypted_gemini_key?: string | null;
    } = {};

    // Encrypt keys if provided, set to null if explicitly deleted
    if (openaiKey !== undefined) {
      updateData.encrypted_openai_key = openaiKey
        ? await encryptApiKey(openaiKey)
        : null;
    }
    if (anthropicKey !== undefined) {
      updateData.encrypted_anthropic_key = anthropicKey
        ? await encryptApiKey(anthropicKey)
        : null;
    }
    if (geminiKey !== undefined) {
      updateData.encrypted_gemini_key = geminiKey
        ? await encryptApiKey(geminiKey)
        : null;
    }

    // Update profile using service role to bypass RLS for auto-approval
    const { data: updatedProfile, error: updateError } = await serviceSupabase
      .from("user_profiles")
      .update(updateData)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 },
      );
    }

    // Return success with masked keys
    const hasAnyKey = !!(
      updatedProfile.encrypted_openai_key ||
      updatedProfile.encrypted_anthropic_key ||
      updatedProfile.encrypted_gemini_key
    );

    return NextResponse.json({
      success: true,
      message: hasAnyKey
        ? "API keys saved successfully. Your account has been auto-approved."
        : "API keys updated successfully.",
      status: updatedProfile.status,
      hasApiKeys: hasAnyKey,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
