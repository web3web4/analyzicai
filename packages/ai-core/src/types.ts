import { z } from "zod";

export interface BaseAnalysisResult {
  provider: string;
  overallScore: number;
}

export type AIProvider = "openai" | "gemini" | "anthropic";

export type AnalysisStep = "v1_initial" | "v2_rethink" | "v3_synthesis";

export interface ProviderError {
  provider: string;
  error: Error;
  step: AnalysisStep;
}

export interface OrchestratorResult<TResult extends BaseAnalysisResult> {
  v1Results: Map<
    string,
    { result: TResult; tokensUsed: number; latencyMs: number }
  >;
  v2Results: Map<
    string,
    { result: TResult; tokensUsed: number; latencyMs: number }
  >;
  synthesisResult: {
    result: TResult;
    tokensUsed: number;
    latencyMs: number;
  } | null;
  finalScore: number;
  errors: ProviderError[];
  hasPartialResults: boolean;
}
