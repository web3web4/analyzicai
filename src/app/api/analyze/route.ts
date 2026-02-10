import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { AIProvider } from "@/lib/ai/types";

const analyzeRequestSchema = z.object({
  analysisId: z.string().uuid(),
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

    // Parse and validate request
    const body = await request.json();
    const { analysisId, userApiKeys } = analyzeRequestSchema.parse(body);

    // Check if user provided any API keys
    const hasUserKeys = !!(
      userApiKeys?.openai ||
      userApiKeys?.anthropic ||
      userApiKeys?.gemini
    );

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
    const providers = analysis.providers_used as AIProvider[];
    const masterProvider = analysis.master_provider as AIProvider;
    const modelTier = analysis.model_tier as
      | import("@/lib/ai/types").ModelTier
      | undefined;

    console.log("[API] Starting analysis with config:", {
      analysisId,
      providers,
      masterProvider,
      modelTier: modelTier || "tier2",
      imageCount: imagesBase64.length,
    });

    // Check API keys availability (without logging the actual keys)
    console.log("[API] API keys available:", {
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
    });

    try {
      // Initialize orchestrator with API keys and model tier
      // Prioritize user-provided keys, fall back to server keys
      const { AnalysisOrchestrator } = await import("@/lib/ai/orchestrator");
      const orchestrator = new AnalysisOrchestrator({
        apiKeys: {
          openai: userApiKeys?.openai || process.env.OPENAI_API_KEY,
          gemini: userApiKeys?.gemini || process.env.GEMINI_API_KEY,
          anthropic: userApiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
        },
        modelTier,
      });

      // Update status and track if using user keys
      await supabase
        .from("analyses")
        .update({
          status: "step1",
          used_user_api_keys: hasUserKeys,
        })
        .eq("id", analysisId);

      const results = await orchestrator.runPipeline(
        {
          providers,
          masterProvider,
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
