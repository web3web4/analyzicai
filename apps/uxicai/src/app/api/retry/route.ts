import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AIProvider } from "@web3web4/ai-core";

const PROVIDER_INFO: Record<AIProvider, { name: string }> = {
  openai: { name: "OpenAI GPT" },
  gemini: { name: "Gemini Pro Vision" },
  anthropic: { name: "Claude 3 Sonnet" },
};

const retryRequestSchema = z.object({
  analysisId: z.string().uuid(),
  failedProviders: z.array(z.enum(["openai", "gemini", "anthropic"])),
  retryStep: z.enum(["v1_initial", "v3_synthesis"]),
  retryProviders: z
    .array(
      z.object({
        originalProvider: z.string(),
        retryProvider: z.string(),
      }),
    )
    .optional(),
  newMasterProvider: z.enum(["openai", "gemini", "anthropic"]).optional(),
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

    // Parse and validate request
    const body = await request.json();
    const {
      analysisId,
      failedProviders,
      retryStep,
      retryProviders,
      newMasterProvider,
    } = retryRequestSchema.parse(body);

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

    // Get existing responses
    const { data: existingResponses } = await supabase
      .from("analysis_responses")
      .select("*")
      .eq("analysis_id", analysisId);

    console.log(
      `[Retry API] Retrying ${failedProviders.length} providers for analysis ${analysisId}`,
    );

    // Get all images from storage
    const imagePaths = analysis.image_paths as string[];
    const imagesBase64: string[] = [];

    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const { data: imageData, error: downloadError } = await supabase.storage
        .from("analysis-images")
        .download(imagePath);

      if (downloadError || !imageData) {
        return NextResponse.json(
          { error: `Failed to retrieve image ${i + 1}` },
          { status: 500 },
        );
      }

      const arrayBuffer = await imageData.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = imageData.type || "image/png";
      imagesBase64.push(`data:${mimeType};base64,${base64}`);
    }

    // Initialize orchestrator
    const { AnalysisOrchestrator, analysisResultSchema } =
      await import("@web3web4/ai-core");
    const orchestrator = new AnalysisOrchestrator({
      apiKeys: {
        openai: process.env.OPENAI_API_KEY,
        gemini: process.env.GEMINI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
      },
      schema: analysisResultSchema,
    });

    const masterProvider = analysis.master_provider as AIProvider;

    try {
      if (retryStep === "v1_initial") {
        // Retry failed initial analyses (with optional provider substitution)
        const { getUXTemplates, buildUXPrompt } =
          await import("@web3web4/ai-core");
        const imageCount = imagesBase64.length;
        const templates = getUXTemplates(imageCount);
        const systemPrompt = templates.initial.systemPrompt;
        const userPrompt = buildUXPrompt(templates.initial.userPromptTemplate, {
          imageCount,
        });

        const newRecords = [];

        // Build retry map: which provider to use for each failed provider
        const retryMap = new Map<string, string>();
        if (retryProviders && retryProviders.length > 0) {
          retryProviders.forEach((config) => {
            retryMap.set(config.originalProvider, config.retryProvider);
          });
        } else {
          // Default: retry same providers
          failedProviders.forEach((p) => retryMap.set(p, p));
        }

        for (const [originalProvider, selectedProvider] of retryMap.entries()) {
          try {
            const provider = orchestrator.getProvider(
              selectedProvider as AIProvider,
            );
            const result = await provider.analyze(
              systemPrompt,
              userPrompt,
              imagesBase64,
            );

            newRecords.push({
              analysis_id: analysisId,
              provider: selectedProvider, // Store the actual provider used
              step: "v1_initial",
              result: result.result,
              score: result.result.overallScore,
              tokens_used: result.tokensUsed,
              latency_ms: result.latencyMs,
            });

            console.log(
              `[Retry API] Successfully retried ${originalProvider} using ${selectedProvider}`,
            );
          } catch (error) {
            console.error(
              `[Retry API] Provider ${selectedProvider} (for ${originalProvider}) failed:`,
              error,
            );
          }
        }

        // Insert new successful responses
        if (newRecords.length > 0) {
          await supabase.from("analysis_responses").insert(newRecords);
        }

        // Update providers_used if any substitutions were made
        // This ensures the analysis record reflects the actual providers that succeeded
        const originalProviders = analysis.providers_used as string[];
        const updatedProviders = [...originalProviders];
        let providersChanged = false;

        for (const [originalProvider, selectedProvider] of retryMap.entries()) {
          // Only update if substitution was made AND the retry succeeded
          if (
            originalProvider !== selectedProvider &&
            newRecords.some((r) => r.provider === selectedProvider)
          ) {
            const index = updatedProviders.indexOf(originalProvider);
            if (index !== -1) {
              updatedProviders[index] = selectedProvider;
              providersChanged = true;
            }
          }
        }

        if (providersChanged) {
          await supabase
            .from("analyses")
            .update({ providers_used: updatedProviders })
            .eq("id", analysisId);

          if (process.env.NODE_ENV !== "production") {
            console.log(
              `[Retry API] Updated providers_used from`,
              originalProviders,
              "to",
              updatedProviders,
            );
          }
        }

        // Now retry synthesis if we have enough providers
        const allV1Responses = [
          ...(existingResponses?.filter((r) => r.step === "v1_initial") || []),
          ...newRecords,
        ];

        if (allV1Responses.length > 0) {
          // Delete old synthesis if it exists
          await supabase
            .from("analysis_responses")
            .delete()
            .eq("analysis_id", analysisId)
            .eq("step", "v3_synthesis");

          // Retry synthesis
          const { getUXTemplates, buildUXPrompt } =
            await import("@web3web4/ai-core");
          const templates = getUXTemplates(imagesBase64.length);
          const systemPrompt = templates.synthesis.systemPrompt;
          const userPrompt = buildUXPrompt(
            templates.synthesis.userPromptTemplate,
            { imageCount: imagesBase64.length },
          );

          try {
            const provider = orchestrator.getProvider(masterProvider);
            const allResults = allV1Responses.map((r) => r.result);
            const synthesisResult = await provider.synthesize(
              systemPrompt,
              userPrompt,
              allResults,
              imagesBase64,
            );

            await supabase.from("analysis_responses").insert({
              analysis_id: analysisId,
              provider: masterProvider,
              step: "v3_synthesis",
              result: synthesisResult.result,
              score: synthesisResult.result.overallScore,
              tokens_used: synthesisResult.tokensUsed,
              latency_ms: synthesisResult.latencyMs,
            });

            // Update analysis status to completed
            await supabase
              .from("analyses")
              .update({
                status: "completed",
                final_score: synthesisResult.result.overallScore,
              })
              .eq("id", analysisId);

            return NextResponse.json({
              success: true,
              analysisId,
              retriedProviders: newRecords.map((r) => r.provider),
              synthesisRetried: true,
              message: `Successfully retried with ${newRecords.length} provider(s) and synthesis`,
            });
          } catch (synthError) {
            console.error("[Retry API] Synthesis retry failed:", synthError);
          }
        }

        return NextResponse.json({
          success: true,
          analysisId,
          retriedProviders: newRecords.map((r) => r.provider),
          synthesisRetried: false,
          message: `Successfully retried ${newRecords.length} provider(s)`,
        });
      } else if (retryStep === "v3_synthesis") {
        // Retry only synthesis (with optional master provider change)
        const v1Responses =
          existingResponses?.filter((r) => r.step === "v1_initial") || [];

        if (v1Responses.length === 0) {
          return NextResponse.json(
            { error: "No initial responses available for synthesis" },
            { status: 400 },
          );
        }

        // Use new master provider if specified, otherwise use original
        const synthesisProvider = newMasterProvider || masterProvider;

        console.log(
          `[Retry API] Retrying synthesis with ${synthesisProvider} (original: ${masterProvider})`,
        );

        // Delete old synthesis attempt
        await supabase
          .from("analysis_responses")
          .delete()
          .eq("analysis_id", analysisId)
          .eq("step", "v3_synthesis");

        const { getUXTemplates, buildUXPrompt } =
          await import("@web3web4/ai-core");
        const templates = getUXTemplates(imagesBase64.length);
        const systemPrompt = templates.synthesis.systemPrompt;
        const userPrompt = buildUXPrompt(
          templates.synthesis.userPromptTemplate,
          {
            imageCount: imagesBase64.length,
          },
        );

        const provider = orchestrator.getProvider(synthesisProvider);
        const allResults = v1Responses.map((r) => r.result);
        const synthesisResult = await provider.synthesize(
          systemPrompt,
          userPrompt,
          allResults,
          imagesBase64,
        );

        await supabase.from("analysis_responses").insert({
          analysis_id: analysisId,
          provider: synthesisProvider, // Use the selected provider
          step: "v3_synthesis",
          result: synthesisResult.result,
          score: synthesisResult.result.overallScore,
          tokens_used: synthesisResult.tokensUsed,
          latency_ms: synthesisResult.latencyMs,
        });

        // Update analysis with new master provider if changed
        const updateData: any = {
          status: "completed",
          final_score: synthesisResult.result.overallScore,
        };

        if (newMasterProvider && newMasterProvider !== masterProvider) {
          updateData.master_provider = newMasterProvider;
        }

        await supabase.from("analyses").update(updateData).eq("id", analysisId);

        const message =
          newMasterProvider && newMasterProvider !== masterProvider
            ? `Successfully retried synthesis with ${PROVIDER_INFO[newMasterProvider as AIProvider]?.name || newMasterProvider}`
            : "Successfully retried synthesis";

        return NextResponse.json({
          success: true,
          analysisId,
          synthesisRetried: true,
          synthesisProvider,
          message,
        });
      }

      return NextResponse.json(
        { error: "Invalid retry step" },
        { status: 400 },
      );
    } catch (retryError) {
      console.error("[Retry API] Retry failed:", retryError);
      return NextResponse.json(
        {
          error: "Retry failed",
          details:
            retryError instanceof Error ? retryError.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Retry error:", error);

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
