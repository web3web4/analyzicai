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

    try {
      // Run pipeline with generic interface
      console.log("Running orchestrator pipeline...");
      const results = await orchestrator.runPipeline(
        {
          providers: providers || ["openai", "gemini", "anthropic"],
          masterProvider: masterProvider || "openai",
          truncateCodeForSynthesis: truncateCodeForSynthesis, // Pass user preference
        },
        templates,
        {
          systemSuffix,
          userVars: { code: analysisCode },
        },
      );
      console.log("Pipeline complete. Score:", results.finalScore);

      // Determine final status based on results
      const finalStatus = results.hasPartialResults
        ? results.synthesisResult
          ? "completed"
          : "partial"
        : "completed";

      console.log("[API] Pipeline completed", {
        v1Count: results.v1Results?.size || 0,
        hasSynthesis: !!results.synthesisResult,
        errorCount: results.errors?.length || 0,
        hasPartialResults: results.hasPartialResults,
        finalStatus,
      });

      // Store all AI responses in database using formatForDatabase
      const responseRecords = AnalysisOrchestrator.formatForDatabase(
        analysis.id,
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
          // Continue anyway - analysis completed
        } else {
          console.log(
            "[API] Successfully stored",
            responseRecords.length,
            "responses",
          );
        }
      }

      // Update analysis record with result
      console.log("Updating analysis record in DB...");
      await supabase
        .from("analyses")
        .update({
          status: finalStatus,
          final_score: results.finalScore,
          completed_at: new Date().toISOString(),
        })
        .eq("id", analysis.id);

      console.log("Analysis complete and persisted.");

      return NextResponse.json({
        success: true,
        analysisId: analysis.id,
        status: finalStatus,
        finalScore: results.finalScore,
        hasPartialResults: results.hasPartialResults,
      });
    } catch (pipelineError) {
      console.error("Pipeline execution failed:", pipelineError);

      // Update DB to failed state
      await supabase
        .from("analyses")
        .update({
          status: "failed",
        })
        .eq("id", analysis.id);

      throw pipelineError; // Re-throw to be caught by outer catch for generic error response
    }
  } catch (error) {
    console.error("Contract analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed: " + (error as Error).message },
      { status: 500 },
    );
  }
}
