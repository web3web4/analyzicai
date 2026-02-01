import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { AIProvider } from "@/lib/ai/types";

const analyzeRequestSchema = z.object({
  analysisId: z.string().uuid(),
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
    const { analysisId } = analyzeRequestSchema.parse(body);

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

    console.log(`[API] Downloading ${imagePaths.length} image(s) for analysis ${analysisId}`);

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const { data: imageData, error: downloadError } = await supabase.storage
        .from("analysis-images")
        .download(imagePath);

      if (downloadError || !imageData) {
        console.error(`[API] Failed to download image ${i + 1}:`, downloadError);
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

    console.log(`[API] Successfully downloaded ${imagesBase64.length} image(s)`);

    // Run AI analysis pipeline
    const providers = analysis.providers_used as AIProvider[];
    const masterProvider = analysis.master_provider as AIProvider;

    try {
      // Initialize orchestrator with API keys
      const { AnalysisOrchestrator } = await import("@/lib/ai/orchestrator");
      const orchestrator = new AnalysisOrchestrator({
        apiKeys: {
          openai: process.env.OPENAI_API_KEY,
          gemini: process.env.GEMINI_API_KEY,
          anthropic: process.env.ANTHROPIC_API_KEY,
        },
      });

      // Update status and run pipeline
      await supabase
        .from("analyses")
        .update({ status: "step1" })
        .eq("id", analysisId);

      const results = await orchestrator.runPipeline(
        {
          providers,
          masterProvider,
        },
        imagesBase64,
      );

      // Store all AI responses in database
      const responseRecords = AnalysisOrchestrator.formatForDatabase(
        analysisId,
        results,
      );

      const { error: insertError } = await supabase
        .from("analysis_responses")
        .insert(responseRecords);

      if (insertError) {
        console.error("Failed to store analysis responses:", insertError);
        // Continue anyway - analysis completed successfully
      }

      // Update analysis as completed
      const { error: updateError } = await supabase
        .from("analyses")
        .update({
          status: "completed",
          final_score: results.finalScore,
          completed_at: new Date().toISOString(),
        })
        .eq("id", analysisId);

      if (updateError) {
        console.error("[API] Failed to update analysis status:", updateError);
        throw new Error("Failed to update analysis status");
      }

      // Track usage for master provider
      const masterTokens =
        responseRecords.find((r) => r.step === "v3_synthesis")?.tokens_used ||
        0;
      await supabase.from("usage_tracking").insert({
        user_id: user.id,
        analysis_id: analysisId,
        provider: masterProvider,
        tokens_used: masterTokens,
      });

      console.log("[API] Analysis pipeline completed successfully", {
        analysisId,
        finalScore: results.finalScore,
        imageCount: imagesBase64.length,
        providers: Array.from(results.v1Results.keys()),
      });

      return NextResponse.json({
        success: true,
        analysisId,
        status: "completed",
        score: results.finalScore,
        imageCount: imagesBase64.length,
      });
    } catch (aiError) {
      console.error("AI pipeline error:", aiError);

      // Mark analysis as failed
      await supabase
        .from("analyses")
        .update({ status: "failed" })
        .eq("id", analysisId);

      return NextResponse.json(
        {
          error: "AI analysis failed",
          details: aiError instanceof Error ? aiError.message : "Unknown error",
        },
        { status: 500 },
      );
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
