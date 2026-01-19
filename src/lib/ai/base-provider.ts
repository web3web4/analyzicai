import { AnalysisResult } from "./types";

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

  abstract analyze(
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }>;

  abstract rethink(
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
    previousResult: AnalysisResult,
    otherResults: AnalysisResult[],
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }>;

  abstract synthesize(
    imageBase64: string,
    systemPrompt: string,
    userPrompt: string,
    allResults: AnalysisResult[],
  ): Promise<{
    result: AnalysisResult;
    tokensUsed: number;
    latencyMs: number;
  }>;

  getName(): string {
    return this.name;
  }
}
