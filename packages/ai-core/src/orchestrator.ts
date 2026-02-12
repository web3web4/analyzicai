import { z } from "zod";
import {
  AIProvider,
  BaseAnalysisResult,
  ProviderError,
  OrchestratorResult,
} from "./types";
import { BaseAIProvider } from "./base-provider";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { AnthropicProvider } from "./providers/anthropic";
import { ModelTier } from "./domains/ux-analysis/types"; // Keep for config compatibility or move to generic types

// Re-export types
export type {
  AIProvider,
  BaseAnalysisResult,
  ProviderError,
  OrchestratorResult,
};

// Analysis Config Interface
export interface AnalysisConfig {
  providers: AIProvider[];
  masterProvider: AIProvider;
  truncateCodeForSynthesis?: boolean; // Optional: truncate code in synthesis to save tokens
}

// Interface for prompt templates structure required by orchestrator
export interface AnalysisTemplates {
  initial: {
    systemPrompt: string;
    userPromptTemplate: string;
  };
  rethink: {
    systemPrompt: string;
    userPromptTemplate: string;
  };
  synthesis: {
    systemPrompt: string;
    userPromptTemplate: string;
  };
}

export class AnalysisOrchestrator<TResult extends BaseAnalysisResult> {
  private providers: Map<AIProvider, BaseAIProvider<TResult>>;
  private schema: z.ZodSchema<TResult>;

  constructor(options: {
    apiKeys: { openai?: string; gemini?: string; anthropic?: string };
    providerModelTiers?: Record<AIProvider, ModelTier>;
    schema: z.ZodSchema<TResult>;
  }) {
    this.providers = new Map();
    this.schema = options.schema;

    console.log("[Orchestrator] Initializing with API keys:", {
      hasOpenAI: !!options.apiKeys.openai,
      hasGemini: !!options.apiKeys.gemini,
      hasAnthropic: !!options.apiKeys.anthropic,
      providerModelTiers: options.providerModelTiers,
    });

    if (options.apiKeys.openai) {
      this.providers.set(
        "openai",
        new OpenAIProvider(
          {
            apiKey: options.apiKeys.openai,
            modelTier: options.providerModelTiers?.openai || "tier1",
          },
          this.schema,
        ),
      );
      console.log(
        "[Orchestrator] OpenAI provider configured with tier:",
        options.providerModelTiers?.openai || "tier1",
      );
    }
    if (options.apiKeys.gemini) {
      this.providers.set(
        "gemini",
        new GeminiProvider(
          {
            apiKey: options.apiKeys.gemini,
            modelTier: options.providerModelTiers?.gemini || "tier1",
          },
          this.schema,
        ),
      );
      console.log(
        "[Orchestrator] Gemini provider configured with tier:",
        options.providerModelTiers?.gemini || "tier1",
      );
    }
    if (options.apiKeys.anthropic) {
      this.providers.set(
        "anthropic",
        new AnthropicProvider(
          {
            apiKey: options.apiKeys.anthropic,
            modelTier: options.providerModelTiers?.anthropic || "tier1",
          },
          this.schema,
        ),
      );
      console.log(
        "[Orchestrator] Anthropic provider configured with tier:",
        options.providerModelTiers?.anthropic || "tier1",
      );
    }
  }

  public getProvider(name: AIProvider): BaseAIProvider<TResult> {
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
    templates: AnalysisTemplates,
    promptContext: { systemSuffix?: string; userVars: Record<string, any> },
    imagesBase64?: string[],
    onProgress?: (step: string, detail: string) => void,
  ): Promise<{
    results: Map<
      AIProvider,
      { result: TResult; tokensUsed: number; latencyMs: number }
    >;
    errors: ProviderError[];
  }> {
    // We assume promptContext.userVars contains necessary variables like imageCount or code
    // Assuming templates contain placeholders like {{imageCount}} or {{code}}

    // We need a way to interpolate prompts.
    // Assuming a simple interpolation function or passing prompts directly is better?
    // Let's implement a simple interpolation helper inside or import it.

    const buildPrompt = (template: string, vars: Record<string, any>) => {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return vars[key]?.toString() || match;
      });
    };

    onProgress?.("step1", "Starting initial analysis");

    const v1Results = new Map<
      AIProvider,
      { result: TResult; tokensUsed: number; latencyMs: number }
    >();
    const errors: ProviderError[] = [];

    const systemPrompt =
      templates.initial.systemPrompt + (promptContext.systemSuffix || "");
    const userPrompt = buildPrompt(
      templates.initial.userPromptTemplate,
      promptContext.userVars,
    );

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

        console.log(
          `[Orchestrator] ${providerName} analysis succeeded with score ${result.result.overallScore}`,
        );
        v1Results.set(providerName, result);
        return { success: true, providerName };
      } catch (error) {
        console.error(
          `[Orchestrator] Provider ${providerName} failed in step1:`,
          error,
        );
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

  private async runStep3Synthesis(
    config: AnalysisConfig,
    templates: AnalysisTemplates,
    promptContext: { userVars: Record<string, any> },
    providerResults: Map<
      AIProvider,
      { result: TResult; tokensUsed: number; latencyMs: number }
    >,
    imagesBase64?: string[],
    onProgress?: (step: string, detail: string) => void,
  ): Promise<{
    result: TResult;
    tokensUsed: number;
    latencyMs: number;
  } | null> {
    if (providerResults.size === 0) {
      console.error(
        "[Orchestrator] No provider results available for synthesis",
      );
      return null;
    }

    const buildPrompt = (template: string, vars: Record<string, any>) => {
      return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return vars[key]?.toString() || match;
      });
    };

    try {
      onProgress?.("step3", `Master synthesis with ${config.masterProvider}`);

      const masterProvider = this.getProvider(config.masterProvider);
      const allResults: TResult[] = Array.from(providerResults.values()).map(
        (v) => v.result,
      );

      const systemPrompt = templates.synthesis.systemPrompt;

      // For synthesis, include user vars (e.g., contract code)
      // Optionally truncate if requested to avoid token overflow
      let synthesisUserVars = { ...promptContext.userVars };
      if (
        config.truncateCodeForSynthesis &&
        synthesisUserVars.code &&
        typeof synthesisUserVars.code === "string"
      ) {
        const { MAX_CODE_LENGTH_FOR_SYNTHESIS } = await import("./constants");
        const maxCodeLength = MAX_CODE_LENGTH_FOR_SYNTHESIS;
        if (synthesisUserVars.code.length > maxCodeLength) {
          console.log(
            `[Orchestrator] Truncating code for synthesis: ${synthesisUserVars.code.length} -> ${maxCodeLength} chars`,
          );
          synthesisUserVars.code =
            synthesisUserVars.code.substring(0, maxCodeLength) +
            "\n\n// ... (code truncated for synthesis to prevent token overflow)";
        }
      }

      const userPrompt = buildPrompt(
        templates.synthesis.userPromptTemplate,
        synthesisUserVars,
      );

      return await masterProvider.synthesize(
        systemPrompt,
        userPrompt,
        allResults,
        imagesBase64,
      );
    } catch (error) {
      console.error(
        `[Orchestrator] Synthesis failed with ${config.masterProvider}:`,
        error,
      );
      return null;
    }
  }

  async runPipeline(
    config: AnalysisConfig,
    templates: AnalysisTemplates,
    promptContext: { systemSuffix?: string; userVars: Record<string, any> },
    imagesBase64?: string[],
    onProgress?: (step: string, detail: string) => void,
  ): Promise<OrchestratorResult<TResult>> {
    // Validate providers
    this.validateProviders(config);

    const allErrors: ProviderError[] = [];

    // Step 1: Initial Analysis
    const step1 = await this.runStep1InitialAnalysis(
      config,
      templates,
      promptContext,
      imagesBase64,
      onProgress,
    );

    const v1Results = step1.results;
    allErrors.push(...step1.errors);

    console.log(
      `[Orchestrator] Step 1 complete: ${v1Results.size} successful, ${step1.errors.length} failed`,
    );

    if (v1Results.size === 0) {
      throw new Error(
        `All providers failed in initial analysis. Errors: ${step1.errors
          .map((e) => `${e.provider}: ${e.error.message}`)
          .join("; ")}`,
      );
    }

    // Step 2: Skip rethink for now (can be re-enabled later by passing rethink templates)
    const v2Results = new Map<
      AIProvider,
      { result: TResult; tokensUsed: number; latencyMs: number }
    >();

    // Step 3: Master Synthesis
    const synthesisResult = await this.runStep3Synthesis(
      config,
      templates,
      promptContext,
      v1Results, // Using v1Results directly
      imagesBase64,
      onProgress,
    );

    if (!synthesisResult) {
      allErrors.push({
        provider: config.masterProvider,
        error: new Error("Synthesis step failed"),
        step: "v3_synthesis",
      });
    }

    // Calculate final score
    let finalScore = 0;
    if (synthesisResult) {
      finalScore = synthesisResult.result.overallScore;
    } else if (v1Results.size > 0) {
      const scores = Array.from(v1Results.values()).map(
        (r) => r.result.overallScore,
      );
      finalScore = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length,
      );
      console.log(
        `[Orchestrator] Using average score from ${v1Results.size} providers: ${finalScore}`,
      );
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

  static formatForDatabase<T extends BaseAnalysisResult>(
    analysisId: string,
    results: OrchestratorResult<T>,
  ): Array<{
    analysis_id: string;
    provider: string;
    step: string;
    result: T;
    score: number;
    tokens_used: number;
    latency_ms: number;
  }> {
    const records: Array<{
      analysis_id: string;
      provider: string;
      step: string;
      result: T;
      score: number;
      tokens_used: number;
      latency_ms: number;
    }> = [];

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
