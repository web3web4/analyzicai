import { NextRequest, NextResponse } from "next/server";
import {
  AnalysisOrchestrator,
  getContractTemplates,
  contractAnalysisResultSchema,
  buildContractContextPrompt,
} from "@web3web4/ai-core";
import { fetchGitHubCode } from "@/lib/github-loader";
import {
  createClient,
  createServiceClient,
} from "@web3web4/shared-platform/supabase/server";
import { decryptApiKey } from "@web3web4/shared-platform/auth/crypto";

/**
 * Runs the analysis pipeline in the background and updates the database incrementally
 */
async function runPipelineInBackground(
  orchestrator: AnalysisOrchestrator<any>,
  pipelineOptions: {
    providers: any[];
    masterProvider: any;
    truncateCodeForSynthesis?: boolean;
  },
  templates: any,
  context: {
    systemSuffix: string;
    userVars: { code: string };
  },
  analysisId: string,
) {
  const supabase = await createServiceClient();

  try {
    console.log("[Background Pipeline] Starting pipeline for:", analysisId);

    // Update status to processing
    await supabase
      .from("analyses")
      .update({ status: "processing" })
      .eq("id", analysisId);

    // Run pipeline with callback to write to DB after each step
    const results = await orchestrator.runPipeline(
      pipelineOptions,
      templates,
      context,
      undefined, // no images for contract analysis
      undefined, // onProgress callback
      async (step, stepResults) => {
        // This callback is called after each step completes
        console.log(
          `[Background Pipeline] Step ${step} completed with ${stepResults.size} results`,
        );

        const stepName =
          step === "v1"
            ? "v1_initial"
            : step === "v2"
            ? "v2_rethink"
            : "v3_synthesis";

        // Convert Map to array of records
        const records = Array.from(stepResults.entries()).map(
          ([provider, data]) => ({
            analysis_id: analysisId,
            provider,
            step: stepName,
            result: data.result,
            tokens_used: data.tokensUsed,
            latency_ms: data.latencyMs,
          }),
        );

        if (records.length > 0) {
          const { error } = await supabase
            .from("analysis_responses")
            .insert(records);

          if (error) {
            console.error(
              `[Background Pipeline] Failed to store ${stepName} responses:`,
              error,
            );
          } else {
            console.log(
              `[Background Pipeline] Stored ${records.length} ${stepName} response(s)`,
            );
          }
        }
      },
    );

    console.log("[Background Pipeline] Complete. Score:", results.finalScore);

    // Determine final status based on results
    const finalStatus = results.hasPartialResults
      ? results.synthesisResult
        ? "completed"
        : "partial"
      : "completed";

    console.log("[Background Pipeline] Pipeline completed", {
      analysisId,
      v1Count: results.v1Results?.size || 0,
      hasSynthesis: !!results.synthesisResult,
      errorCount: results.errors?.length || 0,
      hasPartialResults: results.hasPartialResults,
      finalStatus,
    });

    // Update analysis record with final result
    console.log("[Background Pipeline] Updating analysis record...");
    await supabase
      .from("analyses")
      .update({
        status: finalStatus,
        final_score: results.finalScore,
        completed_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    console.log("[Background Pipeline] Analysis complete and persisted.");
  } catch (pipelineError) {
    console.error("[Background Pipeline] Execution failed:", pipelineError);

    // Update DB to failed state
    await supabase
      .from("analyses")
      .update({
        status: "failed",
      })
      .eq("id", analysisId);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const {
      code,
      githubUrl,
      contractContext,
      providers,
      masterProvider,
      modelTiers,
      userApiKeys, // Destruct user provided keys
      inputType, // 'code' or 'github'
      truncateCodeForSynthesis, // Optional: truncate large code in synthesis
    } = await req.json();

    console.log("Starting contract analysis request...");
    // Validate input
    if (!code && !githubUrl) {
      console.error("Missing code or githubUrl");
      return NextResponse.json(
        { error: "Either code or githubUrl is required" },
        { status: 400 },
      );
    }

    // Fetch code if GitHub URL provided
    let analysisCode = code;
    let finalContext = { ...contractContext };

    if (githubUrl) {
      try {
        console.log("Fetching code from GitHub:", githubUrl);
        analysisCode = await fetchGitHubCode(githubUrl);
        console.log("Fetched code length:", analysisCode.length);
        finalContext.githubRepo = githubUrl;
      } catch (error) {
        console.error("GitHub fetch error:", error);
        return NextResponse.json(
          { error: `Failed to fetch GitHub code: ${(error as Error).message}` },
          { status: 400 },
        );
      }
    }

    // Create analysis record in DB
    console.log("Creating analysis record in DB...");
    const { data: analysis, error: dbError } = await supabase
      .from("analyses")
      .insert({
        user_id: user.id,
        source_type: inputType || (githubUrl ? "github" : "code"),
        input_context: analysisCode, // Store the code
        repo_info: githubUrl ? { url: githubUrl } : null,
        providers_used: providers || ["openai", "gemini", "anthropic"],
        master_provider: masterProvider || "openai",
        status: "pending",
        // Empty image paths for contract analysis
        image_paths: [],
        image_count: 0,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB Insert Error:", dbError);
      throw new Error("Failed to create analysis record");
    }
    console.log("Analysis record created:", analysis.id);

    // Initialize orchestrator with schema
    console.log("Initializing Orchestrator...");
    // Priority: 1. Stored keys (from user profile), 2. Request-provided keys, 3. Server keys
    const apiKeys = {
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
    };

    console.log("API Keys presence:", {
      openai: !!apiKeys.openai,
      gemini: !!apiKeys.gemini,
      anthropic: !!apiKeys.anthropic,
    });

    const orchestrator = new AnalysisOrchestrator({
      apiKeys,
      providerModelTiers: modelTiers,
      schema: contractAnalysisResultSchema,
    });

    // Prepare templates and context
    const templates = getContractTemplates();
    const systemSuffix = buildContractContextPrompt(finalContext);

    // Return immediately with the analysis ID so user can be redirected
    // Run the pipeline asynchronously in the background
    const analysisId = analysis.id;

    // Run pipeline in background (don't await)
    runPipelineInBackground(
      orchestrator,
      {
        providers: providers || ["openai", "gemini", "anthropic"],
        masterProvider: masterProvider || "openai",
        truncateCodeForSynthesis: truncateCodeForSynthesis,
      },
      templates,
      {
        systemSuffix,
        userVars: { code: analysisCode },
      },
      analysisId,
    ).catch((error) => {
      console.error("[Background Pipeline] Fatal error:", error);
    });

    console.log("Analysis started in background. Returning to user...");

    return NextResponse.json({
      success: true,
      analysisId: analysisId,
      status: "pending",
    });
  } catch (error) {
    console.error("Contract analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed: " + (error as Error).message },
      { status: 500 },
    );
  }
}
