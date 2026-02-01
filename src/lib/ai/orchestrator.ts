import {
  AIProvider,
  AnalysisResult,
  AnalysisConfig,
  SynthesizedResult,
} from "./types";
import { BaseAIProvider } from "./base-provider";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { AnthropicProvider } from "./providers/anthropic";
import {
  getTemplates,
  buildPrompt,
} from "./prompts/templates";

interface ProviderError {
  provider: AIProvider;
  error: Error;
  step: "v1_initial" | "v2_rethink" | "v3_synthesis";
}

interface OrchestratorResult {
  v1Results: Map<
    AIProvider,
    { result: AnalysisResult; tokensUsed: number; latencyMs: number }
  >;
  v2Results: Map<
    AIProvider,
    { result: AnalysisResult; tokensUsed: number; latencyMs: number }
  >;
  synthesisResult: {
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  } | null;
  finalScore: number;
  errors: ProviderError[];
  hasPartialResults: boolean;
}

export class AnalysisOrchestrator {
  private providers: Map<AIProvider, BaseAIProvider>;

  constructor(options: {
    apiKeys: { openai?: string; gemini?: string; anthropic?: string };
  }) {
    this.providers = new Map();

    console.log("[Orchestrator] Initializing with API keys:", {
      hasOpenAI: !!options.apiKeys.openai,
      hasGemini: !!options.apiKeys.gemini,
      hasAnthropic: !!options.apiKeys.anthropic,
    });

    if (options.apiKeys.openai) {
      this.providers.set(
        "openai",
        new OpenAIProvider({ apiKey: options.apiKeys.openai }),
      );
      console.log("[Orchestrator] OpenAI provider configured");
    }
    if (options.apiKeys.gemini) {
      this.providers.set(
        "gemini",
        new GeminiProvider({ apiKey: options.apiKeys.gemini }),
      );
      console.log("[Orchestrator] Gemini provider configured");
    }
    if (options.apiKeys.anthropic) {
      this.providers.set(
        "anthropic",
        new AnthropicProvider({ apiKey: options.apiKeys.anthropic }),
      );
      console.log("[Orchestrator] Anthropic provider configured");
    }
  }

  public getProvider(name: AIProvider): BaseAIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not configured`);
    }
    return provider;
  }

  private validateProviders(config: AnalysisConfig): void {
    console.log("[Orchestrator] Validating providers:", {
      requested: config.providers,
      master: config.masterProvider,
      configured: Array.from(this.providers.keys()),
    });

    for (const providerName of config.providers) {
      if (!this.providers.has(providerName)) {
        const error = `Provider ${providerName} not configured (missing API key?)`;
        console.error("[Orchestrator]", error);
        throw new Error(error);
      }
    }
    if (!this.providers.has(config.masterProvider)) {
      const error = `Master provider ${config.masterProvider} not configured (missing API key?)`;
      console.error("[Orchestrator]", error);
      throw new Error(error);
    }
    
    console.log("[Orchestrator] All providers validated successfully");
  }

  private async runStep1InitialAnalysis(
    config: AnalysisConfig,
    imagesBase64?: string[],
    onProgress?: (step: string, detail: string) => void,
  ): Promise<{
    results: Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >;
    errors: ProviderError[];
  }> {
    const imageCount = imagesBase64?.length || 1;
    const templates = getTemplates(imageCount);
    
    onProgress?.("step1", `Starting initial analysis of ${imageCount} image(s)`);

    const v1Results = new Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >();
    const errors: ProviderError[] = [];

    // Build prompts with image count injected
    const systemPrompt = templates.initial.systemPrompt;
    const userPrompt = buildPrompt(templates.initial.userPromptTemplate, { imageCount });

    const v1Promises = config.providers.map(async (providerName) => {
      try {
        console.log(`[Orchestrator] Starting analysis with ${providerName}`);
        const provider = this.getProvider(providerName);
        onProgress?.("step1", `Analyzing with ${providerName}`);

        const result = await provider.analyze(
          systemPrompt,
          userPrompt,
          imagesBase64,
        );

        console.log(`[Orchestrator] ${providerName} analysis succeeded with score ${result.result.overallScore}`);
        v1Results.set(providerName, result);
        return { success: true, providerName };
      } catch (error) {
        console.error(`[Orchestrator] Provider ${providerName} failed in step1:`, error);
        console.error(`[Orchestrator] ${providerName} error details:`, {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        errors.push({
          provider: providerName,
          error: error instanceof Error ? error : new Error(String(error)),
          step: "v1_initial",
        });
        return { success: false, providerName };
      }
    });

    await Promise.all(v1Promises);
    
    return { results: v1Results, errors };
  }

  // TODO: Version 2 - This method will be re-enabled in version 2
  // For now, this step is skipped in the pipeline
  private async runStep2Rethink(
    config: AnalysisConfig,
    v1Results: Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >,
    imagesBase64?: string[],
    onProgress?: (step: string, detail: string) => void,
  ): Promise<
    Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >
  > {
    const imageCount = imagesBase64?.length || 1;
    const templates = getTemplates(imageCount);
    
    onProgress?.("step2", "Starting cross-provider rethink");

    const v2Results = new Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >();

    const systemPrompt = templates.rethink.systemPrompt;
    const userPrompt = buildPrompt(templates.rethink.userPromptTemplate, { imageCount });

    const v2Promises = config.providers.map(async (providerName) => {
      const provider = this.getProvider(providerName);
      const myV1 = v1Results.get(providerName)!;

      // Get other providers' v1 results
      const otherV1Results: AnalysisResult[] = [];
      for (const [name, v1] of v1Results) {
        if (name !== providerName) {
          otherV1Results.push(v1.result);
        }
      }

      onProgress?.("step2", `Rethinking with ${providerName}`);

      const result = await provider.rethink(
        systemPrompt,
        userPrompt,
        myV1.result,
        otherV1Results,
        imagesBase64,
      );

      v2Results.set(providerName, result);
      return result;
    });

    await Promise.all(v2Promises);
    return v2Results;
  }

  private async runStep3Synthesis(
    config: AnalysisConfig,
    providerResults: Map<
      // Now accepts v1 or v2 results
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >,
    imagesBase64?: string[],
    onProgress?: (step: string, detail: string) => void,
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  } | null> {
    // Check if we have any results to synthesize
    if (providerResults.size === 0) {
      console.error("[Orchestrator] No provider results available for synthesis");
      return null;
    }

    const imageCount = imagesBase64?.length || 1;
    const templates = getTemplates(imageCount);
    
    try {
      onProgress?.("step3", `Master synthesis with ${config.masterProvider}`);

      const masterProvider = this.getProvider(config.masterProvider);
      const allResults: AnalysisResult[] = Array.from(
        providerResults.values(),
      ).map((v) => v.result);

      const systemPrompt = templates.synthesis.systemPrompt;
      const userPrompt = buildPrompt(templates.synthesis.userPromptTemplate, { imageCount });

      return await masterProvider.synthesize(
        systemPrompt,
        userPrompt,
        allResults,
        imagesBase64,
      );
    } catch (error) {
      console.error(`[Orchestrator] Synthesis failed with ${config.masterProvider}:`, error);
      // Return null to indicate synthesis failure but preserve partial results
      return null;
    }
  }

  async runPipeline(
    config: AnalysisConfig,
    imagesBase64?: string[],
    onProgress?: (step: string, detail: string) => void,
  ): Promise<OrchestratorResult> {
    // Validate providers
    this.validateProviders(config);

    const allErrors: ProviderError[] = [];

    // Step 1: Initial Analysis from all providers (parallel)
    const step1 = await this.runStep1InitialAnalysis(
      config,
      imagesBase64,
      onProgress,
    );
    
    const v1Results = step1.results;
    allErrors.push(...step1.errors);

    console.log(`[Orchestrator] Step 1 complete: ${v1Results.size} successful, ${step1.errors.length} failed`);

    // If all providers failed in step 1, throw error
    if (v1Results.size === 0) {
      throw new Error(`All providers failed in initial analysis. Errors: ${step1.errors.map(e => `${e.provider}: ${e.error.message}`).join("; ")}`);
    }

    // Step 2: Cross-Provider Rethink (parallel)
    // TODO: Version 2 - This step will be implemented in a future version
    // For now, we skip the rethink step and use v1 results directly for synthesis
    const v2Results = new Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >();

    // Step 3: Master Synthesis
    const synthesisResult = await this.runStep3Synthesis(
      config,
      v1Results, // Using v1Results directly instead of v2Results for now
      imagesBase64,
      onProgress,
    );

    // If synthesis failed, add error but continue with partial results
    if (!synthesisResult) {
      allErrors.push({
        provider: config.masterProvider,
        error: new Error("Synthesis step failed"),
        step: "v3_synthesis",
      });
    }

    // Calculate final score (synthesis result's overall score or average of v1 scores if synthesis failed)
    let finalScore = 0;
    if (synthesisResult) {
      finalScore = synthesisResult.result.overallScore;
    } else if (v1Results.size > 0) {
      // Use average of successful providers as fallback
      const scores = Array.from(v1Results.values()).map(r => r.result.overallScore);
      finalScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      console.log(`[Orchestrator] Using average score from ${v1Results.size} providers: ${finalScore}`);
    }

    const hasPartialResults = allErrors.length > 0;

    return {
      v1Results,
      v2Results,
      synthesisResult,
      finalScore,
      errors: allErrors,
      hasPartialResults,
    };
  }

  /**
   * Convert orchestrator result to database-ready format
   */
  static formatForDatabase(
    analysisId: string,
    results: OrchestratorResult,
  ): Array<{
    analysis_id: string;
    provider: string;
    step: string;
    result: AnalysisResult;
    score: number;
    tokens_used: number;
    latency_ms: number;
  }> {
    const records: Array<{
      analysis_id: string;
      provider: string;
      step: string;
      result: AnalysisResult;
      score: number;
      tokens_used: number;
      latency_ms: number;
    }> = [];

    // V1 results (only successful ones)
    for (const [provider, data] of results.v1Results) {
      records.push({
        analysis_id: analysisId,
        provider,
        step: "v1_initial",
        result: data.result,
        score: data.result.overallScore,
        tokens_used: data.tokensUsed,
        latency_ms: data.latencyMs,
      });
    }

    // V2 results
    // TODO: Version 2 - Rethink step will be re-enabled in version 2
    // for (const [provider, data] of results.v2Results) {
    //   records.push({
    //     analysis_id: analysisId,
    //     provider,
    //     step: "v2_rethink",
    //     result: data.result,
    //     score: data.result.overallScore,
    //     tokens_used: data.tokensUsed,
    //     latency_ms: data.latencyMs,
    //   });
    // }

    // Synthesis result (only if successful)
    if (results.synthesisResult) {
      records.push({
        analysis_id: analysisId,
        provider: results.synthesisResult.result.provider,
        step: "v3_synthesis",
        result: results.synthesisResult.result,
        score: results.synthesisResult.result.overallScore,
        tokens_used: results.synthesisResult.tokensUsed,
        latency_ms: results.synthesisResult.latencyMs,
      });
    }

    return records;
  }
}

export type { OrchestratorResult, ProviderError };
