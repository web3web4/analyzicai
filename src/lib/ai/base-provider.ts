import { AnalysisResult, analysisResultSchema } from "./types";

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
}

export abstract class BaseAIProvider {
  protected name: string;
  protected config: AIProviderConfig;

  constructor(name: string, config: AIProviderConfig) {
    this.name = name;
    this.config = config;
  }

  /**
   * Provider-specific API call implementation.
   * Each provider must implement this to handle their specific API format.
   * @param systemPrompt - System-level instructions
   * @param userPrompt - User's prompt/query
   * @param imagesBase64 - Optional array of base64-encoded images (empty array or undefined for text-only)
   */
  protected abstract callAPI(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64?: string[],
  ): Promise<{ content: string; tokensUsed: number }>;

  /**
   * Hook for parsing response content.
   * Override this if provider returns non-standard JSON (e.g., markdown-wrapped).
   * Default implementation: direct JSON parse.
   */
  protected parseResponseContent(content: string): unknown {
    return JSON.parse(content);
  }

  async analyze(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64?: string[],
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const startTime = Date.now();

    const { content, tokensUsed } = await this.callAPI(
      systemPrompt,
      userPrompt,
      imagesBase64,
    );

    const parsed = this.parseResponseContent(content) as Record<
      string,
      unknown
    >;
    const result = analysisResultSchema.parse({
      ...parsed,
      provider: this.name,
    });

    return {
      result,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }

  async rethink(
    systemPrompt: string,
    userPrompt: string,
    previousResult: AnalysisResult,
    otherResults: AnalysisResult[],
    imagesBase64?: string[],
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const startTime = Date.now();

    const enhancedPrompt = `${userPrompt}

## Your Previous Analysis
${JSON.stringify(previousResult, null, 2)}

## Other AI Perspectives
${otherResults.map((r) => `### ${r.provider}\n${JSON.stringify(r, null, 2)}`).join("\n\n")}

Based on these other perspectives, reconsider your analysis. Where do you agree or disagree? Provide your revised assessment.`;

    const { content, tokensUsed } = await this.callAPI(
      systemPrompt,
      enhancedPrompt,
      imagesBase64,
    );

    const parsed = this.parseResponseContent(content) as Record<
      string,
      unknown
    >;
    const result = analysisResultSchema.parse({
      ...parsed,
      provider: this.name,
    });

    return {
      result,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }

  async synthesize(
    systemPrompt: string,
    userPrompt: string,
    allResults: AnalysisResult[],
    imagesBase64?: string[],
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }> {
    const startTime = Date.now();

    const synthesisPrompt = `${userPrompt}

## All Provider Analyses (v2 Rethink Phase)
${allResults.map((r) => `### ${r.provider}\n${JSON.stringify(r, null, 2)}`).join("\n\n")}

Synthesize these analyses into a final, comprehensive result. Resolve any disagreements between providers, and provide weighted scores based on the consensus. Highlight areas of high agreement and areas where providers significantly disagreed.`;

    const { content, tokensUsed } = await this.callAPI(
      systemPrompt,
      synthesisPrompt,
      imagesBase64,
    );

    const parsed = this.parseResponseContent(content) as Record<
      string,
      unknown
    >;
    const result = analysisResultSchema.parse({
      ...parsed,
      provider: this.name,
    });

    return {
      result,
      tokensUsed,
      latencyMs: Date.now() - startTime,
    };
  }

  getName(): string {
    return this.name;
  }
}
