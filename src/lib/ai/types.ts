import { z } from "zod";

// Category score schema
export const categoryScoreSchema = z.object({
  score: z.number().min(0).max(100),
  observations: z.array(z.string()),
});

export type CategoryScore = z.infer<typeof categoryScoreSchema>;

// Recommendation schema
export const recommendationSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  category: z.string(),
  title: z.string(),
  description: z.string(),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

// Analysis result from a single provider
export const analysisResultSchema = z.object({
  provider: z.string(),
  overallScore: z.number().min(0).max(100),
  categories: z.object({
    colorContrast: categoryScoreSchema,
    typography: categoryScoreSchema,
    layoutComposition: categoryScoreSchema,
    navigation: categoryScoreSchema,
    accessibility: categoryScoreSchema,
    visualHierarchy: categoryScoreSchema,
    whitespace: categoryScoreSchema,
    consistency: categoryScoreSchema,
  }),
  recommendations: z.array(recommendationSchema),
  summary: z.string(),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

// Synthesized result (final output)
export const synthesizedResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  categories: analysisResultSchema.shape.categories,
  recommendations: z.array(recommendationSchema),
  summary: z.string(),
  providerAgreement: z.array(
    z.object({
      category: z.string(),
      agreement: z.enum(["high", "medium", "low"]),
    }),
  ),
});

export type SynthesizedResult = z.infer<typeof synthesizedResultSchema>;

// Provider types
export type AIProvider = "openai" | "gemini" | "claude";

// Analysis step types
export type AnalysisStep = "v1_initial" | "v2_rethink" | "v3_synthesis";

// Analysis config for pipeline
export interface AnalysisConfig {
  providers: AIProvider[];
  masterProvider: AIProvider;
}

// Analysis record (database shape)
export interface AnalysisRecord {
  id: string;
  user_id: string;
  source_type: "upload" | "screen_capture" | "url";
  source_url?: string;
  image_path: string;
  providers_used: string[];
  master_provider: string;
  status: "pending" | "step1" | "step2" | "step3" | "completed" | "failed";
  final_score?: number;
  created_at: string;
  completed_at?: string;
}

// Analysis response record (database shape)
export interface AnalysisResponseRecord {
  id: string;
  analysis_id: string;
  provider: string;
  step: AnalysisStep;
  result: AnalysisResult | SynthesizedResult;
  score?: number;
  tokens_used: number;
  latency_ms?: number;
  created_at: string;
}
