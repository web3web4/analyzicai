export { BaseAIProvider } from "./base-provider";
export type { AIProviderConfig } from "./base-provider";
export { AnalysisOrchestrator } from "./orchestrator";
export type { OrchestratorResult, ProviderError } from "./orchestrator";
export { getModelTierName, getProviderTierOptions } from "./model-tiers";
export type { ModelTier } from "./model-tiers";

// Re-export providers
export { OpenAIProvider } from "./providers/openai";
export { GeminiProvider } from "./providers/gemini";
export { AnthropicProvider } from "./providers/anthropic";

// Re-export UX analysis domain (with UX prefix where needed)
export type {
  AIProvider as UXAIProvider,
  AnalysisResult,
  AnalysisConfig,
  SynthesizedResult,
  CategoryScore,
  Recommendation,
  PerImageResult,
  AnalysisRecord,
  AnalysisResponseRecord,
  WebsiteContext,
} from "./domains/ux-analysis/types";
export { analysisResultSchema } from "./domains/ux-analysis/types";
export {
  buildContextPrompt as buildUXContextPrompt,
  buildPrompt as buildUXPrompt,
} from "./domains/ux-analysis/prompts";
export { getTemplates as getUXTemplates } from "./domains/ux-analysis/prompts/templates";

// Re-export contract analysis domain (with Contract prefix where needed)
export type {
  AIProvider as ContractAIProvider,
  SecurityFinding,
  GasOptimization,
  ContractAnalysisResult,
  ContractAnalysisConfig,
  ContractContext,
  ContractAnalysisRecord,
  ContractAnalysisResponseRecord,
} from "./domains/contract-analysis/types";
export {
  securityFindingSchema,
  gasOptimizationSchema,
  contractAnalysisResultSchema,
} from "./domains/contract-analysis/types";
export {
  buildContextPrompt as buildContractContextPrompt,
  buildPrompt as buildContractPrompt,
} from "./domains/contract-analysis/prompts";
export { getTemplates as getContractTemplates } from "./domains/contract-analysis/prompts/templates";
