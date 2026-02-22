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
  WebsiteContext,
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

async function runAnalysisInBackground(
  analysisId: string,
  userId: string,
  providers: AIProvider[],
  masterProvider: AIProvider,
  providerModelTiers: Record<string, "tier1" | "tier2" | "tier3">,
  imagePaths: string[],
  websiteContext: WebsiteContext | undefined,
  storedApiKeys: { openai: string | null; anthropic: string | null; gemini: string | null },
  userApiKeys: { openai?: string; anthropic?: string; gemini?: string } | undefined,
): Promise<void> {
  const supabase = await createServiceClient();

  try {
    // Download all images
    const imagesBase64: string[] = [];
    for (let i = 0; i < imagePaths.length; i++) {
      const { data: imageData, error: downloadError } = await supabase.storage
        .from("analysis-images")
        .download(imagePaths[i]);

      if (downloadError || !imageData) {
        console.error(`[Background] Failed to download image ${i + 1}:`, downloadError);
        await supabase.from("analyses").update({ status: "failed" }).eq("id", analysisId);
        return;
      }

      const arrayBuffer = await imageData.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = imageData.type || "image/png";
      imagesBase64.push(`data:${mimeType};base64,${base64}`);
    }

    console.log(`[Background] Downloaded ${imagesBase64.length} image(s) for ${analysisId}`);

    const imageCount = imagesBase64.length;
    const templates = getUXTemplates(imageCount) as any;
    const systemSuffix = buildUXContextPrompt(websiteContext);

    const orchestrator = new AnalysisOrchestrator({
      apiKeys: {
        openai: storedApiKeys.openai || userApiKeys?.openai || process.env.OPENAI_API_KEY,
        gemini: storedApiKeys.gemini || userApiKeys?.gemini || process.env.GEMINI_API_KEY,
        anthropic: storedApiKeys.anthropic || userApiKeys?.anthropic || process.env.ANTHROPIC_API_KEY,
      },
      providerModelTiers,
      schema: analysisResultSchema,
    });

    const results = await orchestrator.runPipeline(
      { providers, masterProvider },
      templates,
      { systemSuffix, userVars: { imageCount } },
      imagesBase64,
      undefined, // onProgress
      async (step, stepResults) => {
        if (step !== "v3") return;
        const records = Array.from(stepResults.entries()).map(([provider, data]) => ({
          analysis_id: analysisId,
          provider,
          step: "v3_synthesis",
          result: data.result,
          tokens_used: data.tokensUsed,
          latency_ms: data.latencyMs,
        }));
        if (records.length > 0) {
          const { error } = await supabase.from("analysis_responses").insert(records);
          if (error) console.error("[Background] Failed to store v3_synthesis:", error);
          else console.log(`[Background] Stored v3_synthesis (${records.length} records)`);
        }
      },
      async (step, provider, data) => {
        const stepName = step === "v1" ? "v1_initial" : "v2_rethink";
        const { error } = await supabase.from("analysis_responses").insert({
          analysis_id: analysisId,
          provider,
          step: stepName,
          result: data.result,
          tokens_used: data.tokensUsed,
          latency_ms: data.latencyMs,
        });
        if (error) console.error(`[Background] Failed to store ${stepName} for ${provider}:`, error);
        else console.log(`[Background] Stored ${stepName} for ${provider}`);
      },
    );

    console.log("[Background] Pipeline completed", {
      v1Count: results.v1Results.size,
      hasSynthesis: !!results.synthesisResult,
      errorCount: results.errors.length,
    });

    const finalStatus = results.hasPartialResults
      ? results.synthesisResult
        ? "completed"
        : "partial"
      : "completed";

    await supabase
      .from("analyses")
      .update({
        status: finalStatus,
        final_score: results.finalScore,
        completed_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    // Track usage
    const { data: allResponses } = await supabase
      .from("analysis_responses")
      .select("tokens_used")
      .eq("analysis_id", analysisId);
    const totalTokens = (allResponses ?? []).reduce(
      (sum: number, r: { tokens_used: number }) => sum + (r.tokens_used ?? 0),
      0,
    );
    if (totalTokens > 0) {
      await supabase.from("usage_tracking").insert({
        user_id: userId,
        analysis_id: analysisId,
        provider: masterProvider,
        tokens_used: totalTokens,
      });
    }

    console.log("[Background] Analysis complete", { analysisId, finalStatus, score: results.finalScore });
  } catch (err) {
    console.error("[Background] Fatal error:", err);

    const { data: existing } = await supabase
      .from("analysis_responses")
      .select("id, step")
      .eq("analysis_id", analysisId);

    if (existing && existing.length > 0) {
      const hasSynthesis = existing.some((r) => r.step === "v3_synthesis");
      await supabase
        .from("analyses")
        .update({ status: hasSynthesis ? "completed" : "partial" })
        .eq("id", analysisId);
    } else {
      await supabase.from("analyses").update({ status: "failed" }).eq("id", analysisId);
    }
  }
}

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

    const hasUserKeys = !!(
      storedApiKeys.openai ||
      storedApiKeys.anthropic ||
      storedApiKeys.gemini ||
      userApiKeys?.openai ||
      userApiKeys?.anthropic ||
      userApiKeys?.gemini
    );

    // Update status to processing
    await supabase
      .from("analyses")
      .update({ status: "step1", used_user_api_keys: hasUserKeys })
      .eq("id", analysisId);

    const imagePaths = analysis.image_paths as string[];
    const providers = requestProviders as AIProvider[];
    const masterProvider = requestMasterProvider as AIProvider;

    console.log("[API] Firing background analysis", {
      analysisId,
      providers,
      masterProvider,
      imageCount: imagePaths.length,
    });

    runAnalysisInBackground(
      analysisId,
      user.id,
      providers,
      masterProvider,
      providerModelTiers,
      imagePaths,
      websiteContext,
      storedApiKeys,
      userApiKeys,
    ).catch((err) => console.error("[API] Background runner fatal:", err));

    return NextResponse.json({ success: true, analysisId, status: "pending" });
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
