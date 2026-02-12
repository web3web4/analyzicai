import { z } from "zod";

// ===== Smart Contract Analysis Types =====

export type AIProvider = "openai" | "gemini" | "anthropic";
export type ModelTier = "tier1" | "tier2" | "tier3";

// Security Finding Schema
export const securityFindingSchema = z.object({
  title: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "informational"]),
  description: z.string(),
  location: z.string().optional(), // e.g., "Line 42, function transfer()"
  recommendation: z.string(),
});

export type SecurityFinding = z.infer<typeof securityFindingSchema>;

// Gas Optimization Schema
export const gasOptimizationSchema = z.object({
  title: z.string(),
  potentialSavings: z.string(), // e.g., "~2000 gas per call"
  description: z.string(),
  location: z.string().optional(),
  recommendation: z.string(),
});

export type GasOptimization = z.infer<typeof gasOptimizationSchema>;

// Contract Analysis Result Schema
export const contractAnalysisResultSchema = z.object({
  provider: z.string(),
  overallScore: z.number().min(0).max(100),
  securityScore: z.number().min(0).max(100),
  gasEfficiencyScore: z.number().min(0).max(100),
  codeQualityScore: z.number().min(0).max(100),
  securityFindings: z.array(securityFindingSchema),
  gasOptimizations: z.array(gasOptimizationSchema),
  summary: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
});

export type ContractAnalysisResult = z.infer<
  typeof contractAnalysisResultSchema
>;

// Analysis Configuration
export interface ContractAnalysisConfig {
  providers: AIProvider[];
  masterProvider: AIProvider;
}

// Contract Context
export interface ContractContext {
  contractName?: string;
  blockchain?: string; // e.g., "Ethereum", "Polygon", "BSC"
  solidityVersion?: string;
  purpose?: string; // e.g., "ERC20 Token", "NFT Marketplace", "DeFi Protocol"
  githubRepo?: string;
}

// Database Record Types
export interface ContractAnalysisRecord {
  id: string;
  user_id: string;
  status: "pending" | "processing" | "completed" | "failed" | "partial";
  score: number | null;
  source_code?: string;
  github_url?: string;
  contract_context?: ContractContext;
  created_at: string;
  updated_at: string;
  error?: string;
}

export interface ContractAnalysisResponseRecord {
  id: string;
  analysis_id: string;
  provider: string;
  step: "v1_initial" | "v2_rethink" | "v3_synthesis";
  result: ContractAnalysisResult;
  score: number;
  tokens_used: number;
  latency_ms: number;
  created_at: string;
}
