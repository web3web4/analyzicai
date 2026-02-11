import { NextRequest, NextResponse } from "next/server";
import {
  AnalysisOrchestrator,
  ContractAnalysisConfig,
  ContractContext,
  getContractTemplates,
  contractAnalysisResultSchema,
  buildContractContextPrompt,
} from "@web3web4/ai-core";
import { fetchGitHubCode } from "@/lib/github-loader";

export async function POST(req: NextRequest) {
  try {
    const {
      code,
      githubUrl,
      contractContext,
      providers,
      masterProvider,
      modelTiers,
    } = await req.json();

    // Validate input
    if (!code && !githubUrl) {
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
        analysisCode = await fetchGitHubCode(githubUrl);
        finalContext.githubRepo = githubUrl;
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to fetch GitHub code: ${(error as Error).message}` },
          { status: 400 },
        );
      }
    }

    // Initialize orchestrator with schema
    const orchestrator = new AnalysisOrchestrator({
      apiKeys: {
        openai: process.env.OPENAI_API_KEY,
        gemini: process.env.GEMINI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
      },
      providerModelTiers: modelTiers,
      schema: contractAnalysisResultSchema,
    });

    // Prepare templates and context
    const templates = getContractTemplates();
    const systemSuffix = buildContractContextPrompt(finalContext);

    // Run pipeline with generic interface
    const results = await orchestrator.runPipeline(
      {
        providers: providers || ["openai", "gemini", "anthropic"],
        masterProvider: masterProvider || "openai",
      },
      templates,
      {
        systemSuffix,
        userVars: { code: analysisCode },
      },
    );

    return NextResponse.json({
      success: true,
      results: AnalysisOrchestrator.formatForDatabase("temp-id", results),
      finalScore: results.finalScore,
    });
  } catch (error) {
    console.error("Contract analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
