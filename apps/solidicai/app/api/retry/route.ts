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
  truncateCodeForSynthesis: z.boolean().optional(), // Optional: truncate code in synthesis
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
      truncateCodeForSynthesis,
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

    // Get the contract code from the analysis
    const contractCode = analysis.input_context as string;

    if (!contractCode) {
      return NextResponse.json(
        { error: "Contract code not found in analysis" },
        { status: 400 },
      );
    }

    // Initialize orchestrator
    const { AnalysisOrchestrator, contractAnalysisResultSchema } = await import(
      "@web3web4/ai-core"
    );
    const orchestrator = new AnalysisOrchestrator({
      apiKeys: {
        openai: process.env.OPENAI_API_KEY,
        gemini: process.env.GEMINI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
      },
      schema: contractAnalysisResultSchema,
    });

    const masterProvider = analysis.master_provider as AIProvider;

    try {
      if (retryStep === "v1_initial") {
        // Retry failed initial analyses (with optional provider substitution)
        const { getContractTemplates, buildContractContextPrompt } =
          await import("@web3web4/ai-core");

        const templates = getContractTemplates();
        const contractContext = analysis.repo_info || {};
        const systemSuffix = buildContractContextPrompt(contractContext);
        const systemPrompt =
          templates.initial.systemPrompt + "\n\n" + systemSuffix;
        const userPrompt = templates.initial.userPromptTemplate.replace(
          "{code}",
          contractCode,
        );

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
              [], // No images for contract analysis
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
        const originalProviders = analysis.providers_used as string[];
        const updatedProviders = [...originalProviders];
        let providersChanged = false;

        for (const [originalProvider, selectedProvider] of retryMap.entries()) {
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
          const { getContractTemplates, buildContractPrompt } = await import(
            "@web3web4/ai-core"
          );
          const templates = getContractTemplates();
          const systemPrompt = templates.synthesis.systemPrompt;
          const userPromptTemplate = templates.synthesis.userPromptTemplate;

          // Include code for context, but truncate if too large to avoid token overflow
          let codeForSynthesis = contractCode;
          const maxCodeLength = 15000;
          if (codeForSynthesis.length > maxCodeLength) {
            console.log(
              `[Retry API] Truncating code for synthesis: ${codeForSynthesis.length} -> ${maxCodeLength} chars`,
            );
            codeForSynthesis =
              codeForSynthesis.substring(0, maxCodeLength) +
              "\n\n// ... (code truncated for synthesis to prevent token overflow)";
          }

          const userPrompt = buildContractPrompt(userPromptTemplate, {
            code: codeForSynthesis,
          });

          try {
            const provider = orchestrator.getProvider(masterProvider);
            const allResults = allV1Responses.map((r) => r.result);
            const synthesisResult = await provider.synthesize(
              systemPrompt,
              userPrompt,
              allResults,
              [], // No images for contract analysis
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

        console.log(`[Retry API] v1Responses count:`, v1Responses.length);
        console.log(
          `[Retry API] v1Responses providers:`,
          v1Responses.map((r) => r.provider),
        );

        // Delete old synthesis attempt
        await supabase
          .from("analysis_responses")
          .delete()
          .eq("analysis_id", analysisId)
          .eq("step", "v3_synthesis");

        console.log(`[Retry API] Loading contract templates...`);
        const { getContractTemplates, buildContractPrompt } = await import(
          "@web3web4/ai-core"
        );
        const templates = getContractTemplates();
        const systemPrompt = templates.synthesis.systemPrompt;
        const userPromptTemplate = templates.synthesis.userPromptTemplate;

        // Include code for context, but truncate if too large to avoid token overflow
        let codeForSynthesis = contractCode;
        const maxCodeLength = 15000;
        if (codeForSynthesis.length > maxCodeLength) {
          console.log(
            `[Retry API] Truncating code for synthesis: ${codeForSynthesis.length} -> ${maxCodeLength} chars`,
          );
          codeForSynthesis =
            codeForSynthesis.substring(0, maxCodeLength) +
            "\n\n// ... (code truncated for synthesis to prevent token overflow)";
        }

        const userPrompt = buildContractPrompt(userPromptTemplate, {
          code: codeForSynthesis,
        });

        console.log(
          `[Retry API] Getting provider instance for ${synthesisProvider}...`,
        );
        const provider = orchestrator.getProvider(synthesisProvider);

        if (!provider) {
          throw new Error(`Provider ${synthesisProvider} not available`);
        }

        const allResults = v1Responses.map((r) => r.result);
        console.log(
          `[Retry API] Calling synthesize with ${allResults.length} results...`,
        );

        const synthesisResult = await provider.synthesize(
          systemPrompt,
          userPrompt,
          allResults,
          [], // No images for contract analysis
        );

        console.log(`[Retry API] Synthesis succeeded:`, {
          provider: synthesisProvider,
          score: synthesisResult.result.overallScore,
          tokens: synthesisResult.tokensUsed,
        });

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
            ? `Successfully retried synthesis with ${
                PROVIDER_INFO[newMasterProvider as AIProvider]?.name ||
                newMasterProvider
              }`
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
      console.error(
        "[Retry API] Error stack:",
        retryError instanceof Error ? retryError.stack : "No stack trace",
      );
      console.error("[Retry API] Error details:", {
        name: retryError instanceof Error ? retryError.name : "Unknown",
        message:
          retryError instanceof Error ? retryError.message : String(retryError),
        analysisId,
        retryStep,
      });

      return NextResponse.json(
        {
          error: "Retry failed",
          details:
            retryError instanceof Error ? retryError.message : "Unknown error",
          stack:
            process.env.NODE_ENV !== "production" && retryError instanceof Error
              ? retryError.stack
              : undefined,
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
