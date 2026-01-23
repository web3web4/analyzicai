import {
  AIProvider,
  AnalysisResult,
  AnalysisConfig,
  SynthesizedResult,
} from "./types";
import { BaseAIProvider } from "./base-provider";
import { OpenAIProvider } from "./providers/openai";
import { GeminiProvider } from "./providers/gemini";
import { ClaudeProvider } from "./providers/claude";
import {
  INITIAL_SYSTEM_PROMPT,
  INITIAL_USER_PROMPT,
  RETHINK_SYSTEM_PROMPT,
  RETHINK_USER_PROMPT,
  SYNTHESIS_SYSTEM_PROMPT,
  SYNTHESIS_USER_PROMPT,
} from "./prompts/templates";

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
  };
  finalScore: number;
}

export class AnalysisOrchestrator {
  private providers: Map<AIProvider, BaseAIProvider>;

  constructor(apiKeys: { openai?: string; gemini?: string; claude?: string }) {
    this.providers = new Map();

    if (apiKeys.openai) {
      this.providers.set(
        "openai",
        new OpenAIProvider({ apiKey: apiKeys.openai }),
      );
    }
    if (apiKeys.gemini) {
      this.providers.set(
        "gemini",
        new GeminiProvider({ apiKey: apiKeys.gemini }),
      );
    }
    if (apiKeys.claude) {
      this.providers.set(
        "claude",
        new ClaudeProvider({ apiKey: apiKeys.claude }),
      );
    }
  }

  private getProvider(name: AIProvider): BaseAIProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider ${name} not configured`);
    }
    return provider;
  }

  private validateProviders(config: AnalysisConfig): void {
    for (const providerName of config.providers) {
      if (!this.providers.has(providerName)) {
        throw new Error(`Provider ${providerName} not configured`);
      }
    }
    if (!this.providers.has(config.masterProvider)) {
      throw new Error(
        `Master provider ${config.masterProvider} not configured`,
      );
    }
  }

  private async runStep1InitialAnalysis(
    imageBase64: string,
    config: AnalysisConfig,
    onProgress?: (step: string, detail: string) => void,
  ): Promise<
    Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >
  > {
    onProgress?.("step1", "Starting initial analysis");

    const v1Results = new Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >();

    const v1Promises = config.providers.map(async (providerName) => {
      const provider = this.getProvider(providerName);
      onProgress?.("step1", `Analyzing with ${providerName}`);

      const result = await provider.analyze(
        INITIAL_SYSTEM_PROMPT,
        INITIAL_USER_PROMPT,
        [imageBase64],
      );

      v1Results.set(providerName, result);
      return result;
    });

    await Promise.all(v1Promises);
    return v1Results;
  }

  // TODO: Version 2 - This method will be re-enabled in version 2
  // For now, this step is skipped in the pipeline
  private async runStep2Rethink(
    imageBase64: string,
    config: AnalysisConfig,
    v1Results: Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >,
    onProgress?: (step: string, detail: string) => void,
  ): Promise<
    Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >
  > {
    onProgress?.("step2", "Starting cross-provider rethink");

    const v2Results = new Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >();

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
        RETHINK_SYSTEM_PROMPT,
        RETHINK_USER_PROMPT,
        myV1.result,
        otherV1Results,
        [imageBase64],
      );

      v2Results.set(providerName, result);
      return result;
    });

    await Promise.all(v2Promises);
    return v2Results;
  }

  private async runStep3Synthesis(
    imageBase64: string,
    config: AnalysisConfig,
    providerResults: Map<
      // Now accepts v1 or v2 results
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >,
    onProgress?: (step: string, detail: string) => void,
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    onProgress?.("step3", `Master synthesis with ${config.masterProvider}`);

    const masterProvider = this.getProvider(config.masterProvider);
    const allResults: AnalysisResult[] = Array.from(
      providerResults.values(),
    ).map((v) => v.result);

    return await masterProvider.synthesize(
      SYNTHESIS_SYSTEM_PROMPT,
      SYNTHESIS_USER_PROMPT,
      allResults,
      [imageBase64],
    );
  }

  async runPipeline(
    imageBase64: string,
    config: AnalysisConfig,
    onProgress?: (step: string, detail: string) => void,
  ): Promise<OrchestratorResult> {
    // Validate providers
    this.validateProviders(config);

    // Step 1: Initial Analysis from all providers (parallel)
    const v1Results = await this.runStep1InitialAnalysis(
      imageBase64,
      config,
      onProgress,
    );

    // Step 2: Cross-Provider Rethink (parallel)
    // TODO: Version 2 - This step will be implemented in a future version
    // For now, we skip the rethink step and use v1 results directly for synthesis
    const v2Results = new Map<
      AIProvider,
      { result: AnalysisResult; tokensUsed: number; latencyMs: number }
    >();
    // const v2Results = await this.runStep2Rethink(
    //   imageBase64,
    //   config,
    //   v1Results,
    //   onProgress,
    // );

    // Step 3: Master Synthesis
    // TODO: Version 2 - Currently using v1 results instead of v2 results
    const synthesisResult = await this.runStep3Synthesis(
      imageBase64,
      config,
      v1Results, // Using v1Results directly instead of v2Results for now
      onProgress,
    );

    // Calculate final score (synthesis result's overall score)
    const finalScore = synthesisResult.result.overallScore;

    return {
      v1Results,
      v2Results,
      synthesisResult,
      finalScore,
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

    // V1 results
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

    // Synthesis result
    records.push({
      analysis_id: analysisId,
      provider: results.synthesisResult.result.provider,
      step: "v3_synthesis",
      result: results.synthesisResult.result,
      score: results.synthesisResult.result.overallScore,
      tokens_used: results.synthesisResult.tokensUsed,
      latency_ms: results.synthesisResult.latencyMs,
    });

    return records;
  }
}
