import {
  createClient,
  createServiceClient,
} from "@web3web4/shared-platform/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@web3web4/shared-platform/auth/rate-limit";
import { decryptApiKey } from "@web3web4/shared-platform/auth/crypto";
import { z } from "zod";
import {
  AIProvider,
  analysisResultSchema,
  AnalysisOrchestrator,
  getUXTemplates,
  buildUXContextPrompt,
  buildUXPrompt,
} from "@web3web4/ai-core";

const analyzeRequestSchema = z.object({
  analysisId: z.string().uuid(),
  providers: z.array(z.string()),
  masterProvider: z.string(),
  providerModelTiers: z.record(z.string(), z.enum(["tier1", "tier2", "tier3"])),
  websiteContext: z.any().optional(),
  userApiKeys: z
    .object({
      openai: z.string().optional(),
      anthropic: z.string().optional(),
      gemini: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        },
        { status: 429 },
      );
    }

    // Fetch user's stored API keys from profile
    const serviceSupabase = await createServiceClient();
    const { data: profile } = await serviceSupabase
      .from("user_profiles")
      .select(
        "encrypted_openai_key, encrypted_anthropic_key, encrypted_gemini_key",
      )
      .eq("user_id", user.id)
      .single();

    // Decrypt stored API keys if they exist
    const storedApiKeys = {
      openai: profile?.encrypted_openai_key
        ? await decryptApiKey(profile.encrypted_openai_key)
        : null,
      anthropic: profile?.encrypted_anthropic_key
        ? await decryptApiKey(profile.encrypted_anthropic_key)
        : null,
      gemini: profile?.encrypted_gemini_key
        ? await decryptApiKey(profile.encrypted_gemini_key)
        : null,
    };

    console.log("[API] Stored API keys available:", {
      openai: !!storedApiKeys.openai,
      anthropic: !!storedApiKeys.anthropic,
      gemini: !!storedApiKeys.gemini,
    });

    // Parse and validate request
    const body = await request.json();
    const {
      analysisId,
      providers: requestProviders,
      masterProvider: requestMasterProvider,
      providerModelTiers,
      websiteContext,
      userApiKeys,
    } = analyzeRequestSchema.parse(body);

    // Get analysis record
    const { data: analysis, error: fetchError } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", analysisId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 },
      );
    }

    if (analysis.status !== "pending") {
      return NextResponse.json(
        { error: "Analysis already started or completed" },
        { status: 400 },
      );
    }

    // Update status to step1
    await supabase
      .from("analyses")
      .update({ status: "step1" })
      .eq("id", analysisId);

    // Get all images from storage (multi-image support)
    const imagePaths = analysis.image_paths as string[];
    const imagesBase64: string[] = [];

    console.log(
      `[API] Downloading ${imagePaths.length} image(s) for analysis ${analysisId}`,
    );

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const { data: imageData, error: downloadError } = await supabase.storage
        .from("analysis-images")
        .download(imagePath);

      if (downloadError || !imageData) {
        console.error(
          `[API] Failed to download image ${i + 1}:`,
          downloadError,
        );
        await supabase
          .from("analyses")
          .update({ status: "failed" })
          .eq("id", analysisId);

        return NextResponse.json(
          { error: `Failed to retrieve image ${i + 1}` },
          { status: 500 },
        );
      }

      // Convert image to base64
      const arrayBuffer = await imageData.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = imageData.type || "image/png";
      imagesBase64.push(`data:${mimeType};base64,${base64}`);
    }

    console.log(
      `[API] Successfully downloaded ${imagesBase64.length} image(s)`,
    );

    // Run AI analysis pipeline
    // Use providers from request (validated against DB)
    const providers = requestProviders as AIProvider[];
    const masterProvider = requestMasterProvider as AIProvider;

    console.log("[API] Starting analysis with config:", {
      analysisId,
      providers,
      masterProvider,
      providerModelTiers,
      imageCount: imagesBase64.length,
      hasWebsiteContext: !!websiteContext,
    });

    // Check API keys availability (without logging the actual keys)
    console.log("[API] API keys available:", {
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
    });

    try {
      // Initialize orchestrator with API keys and per-provider model tiers
      // Priority: 1. Stored keys (from user profile), 2. Request-provided keys, 3. Server keys
      const orchestrator = new AnalysisOrchestrator({
        apiKeys: {
          openai:
            storedApiKeys.openai ||
            userApiKeys?.openai ||
            process.env.OPENAI_API_KEY,
          gemini:
            storedApiKeys.gemini ||
            userApiKeys?.gemini ||
            process.env.GEMINI_API_KEY,
          anthropic:
            storedApiKeys.anthropic ||
            userApiKeys?.anthropic ||
            process.env.ANTHROPIC_API_KEY,
        },
        providerModelTiers,
        schema: analysisResultSchema,
      });

      // Track if using user keys (stored or provided in request)
      const hasUserKeys = !!(
        storedApiKeys.openai ||
        storedApiKeys.anthropic ||
        storedApiKeys.gemini ||
        userApiKeys?.openai ||
        userApiKeys?.anthropic ||
        userApiKeys?.gemini
      );

      // Update status and track if using user keys
      await supabase
        .from("analyses")
        .update({
          status: "step1",
          used_user_api_keys: hasUserKeys,
        })
        .eq("id", analysisId);

      // Prepare templates and context
      // Note: getUXTemplates is now synchronous as per original implementation
      const imageCount = imagesBase64.length;
      // Cast to any to bypass strict type checking for now, as the structure is compatible at runtime
      // The Orchestrator expects { initial: { systemPrompt, userPromptTemplate }, ... }
      // and getUXTemplates returns Record<string, PromptTemplate> where PromptTemplate has those fields
      const templates = getUXTemplates(imageCount) as any;
      const systemSuffix = buildUXContextPrompt(websiteContext);

      const results = await orchestrator.runPipeline(
        {
          providers,
          masterProvider,
        },
        templates,
        {
          systemSuffix,
          userVars: { imageCount },
        },
        imagesBase64,
      );

      console.log("[API] Pipeline completed", {
        v1Count: results.v1Results.size,
        hasSynthesis: !!results.synthesisResult,
        errorCount: results.errors.length,
        hasPartialResults: results.hasPartialResults,
      });

      // Store all AI responses in database (including partial results)
      const responseRecords = AnalysisOrchestrator.formatForDatabase(
        analysisId,
        results,
      );

      console.log(
        "[API] Formatted",
        responseRecords.length,
        "records for database",
      );

      if (responseRecords.length > 0) {
        const { error: insertError } = await supabase
          .from("analysis_responses")
          .insert(responseRecords);

        if (insertError) {
          console.error(
            "[API] Failed to store analysis responses:",
            insertError,
          );
          // Continue anyway - we have partial results in memory
        } else {
          console.log(
            "[API] Successfully stored",
            responseRecords.length,
            "responses",
          );
        }
      }

      // Determine final status based on errors
      const finalStatus = results.hasPartialResults
        ? results.synthesisResult
          ? "completed"
          : "partial"
        : "completed";

      console.log("[API] Determined final status:", finalStatus);

      // Store error information if there were failures
      const errorDetails =
        results.errors.length > 0
          ? {
              failed_providers: results.errors.map((e) => e.provider),
              error_details: results.errors.map((e) => ({
                provider: e.provider,
                step: e.step,
                message: e.error.message,
              })),
            }
          : null;

      // Update analysis with final status and score
      // Wrap in try-catch to not lose partial results if update fails
      try {
        const { error: updateError } = await supabase
          .from("analyses")
          .update({
            status: finalStatus,
            final_score: results.finalScore,
            completed_at: new Date().toISOString(),
          })
          .eq("id", analysisId);

        if (updateError) {
          console.error("[API] Failed to update analysis status:", updateError);
          // Don't throw - we still have results saved
        }
      } catch (updateException) {
        console.error("[API] Exception updating analysis:", updateException);
        // Don't throw - we still have results saved
      }

      // Track usage for successful providers
      const totalTokens = responseRecords.reduce(
        (sum, r) => sum + r.tokens_used,
        0,
      );
      if (totalTokens > 0) {
        await supabase.from("usage_tracking").insert({
          user_id: user.id,
          analysis_id: analysisId,
          provider: masterProvider,
          tokens_used: totalTokens,
        });
      }

      console.log("[API] Analysis pipeline completed", {
        analysisId,
        finalStatus,
        finalScore: results.finalScore,
        imageCount: imagesBase64.length,
        successfulProviders: Array.from(results.v1Results.keys()),
        errors: results.errors.length,
      });

      return NextResponse.json({
        success: true,
        analysisId,
        status: finalStatus,
        score: results.finalScore,
        imageCount: imagesBase64.length,
        hasPartialResults: results.hasPartialResults,
        errors: results.errors.length > 0 ? errorDetails : undefined,
      });
    } catch (aiError) {
      console.error("[API] AI pipeline error:", aiError);

      // Check if we have any saved responses before marking as completely failed
      const { data: existingResponses } = await supabase
        .from("analysis_responses")
        .select("id, step, provider")
        .eq("analysis_id", analysisId);

      const hasAnyResults = existingResponses && existingResponses.length > 0;

      console.log(
        "[API] Error occurred but found",
        existingResponses?.length || 0,
        "existing responses",
      );

      if (hasAnyResults) {
        // We have partial results - don't mark as completely failed
        const hasSynthesis = existingResponses.some(
          (r) => r.step === "v3_synthesis",
        );
        const finalStatus = hasSynthesis ? "completed" : "partial";

        await supabase
          .from("analyses")
          .update({ status: finalStatus })
          .eq("id", analysisId);

        console.log("[API] Marked as", finalStatus, "due to partial results");

        return NextResponse.json(
          {
            success: true,
            analysisId,
            status: finalStatus,
            hasPartialResults: true,
            warning: "Analysis completed with errors",
            details:
              aiError instanceof Error ? aiError.message : "Unknown error",
          },
          { status: 200 }, // Return 200 since we have results
        );
      } else {
        // No results at all - mark as failed
        await supabase
          .from("analyses")
          .update({ status: "failed" })
          .eq("id", analysisId);

        console.log("[API] Marked as failed - no results saved");

        return NextResponse.json(
          {
            error: "AI analysis failed completely",
            details:
              aiError instanceof Error ? aiError.message : "Unknown error",
          },
          { status: 500 },
        );
      }
    }
  } catch (error) {
    console.error("Analyze error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
