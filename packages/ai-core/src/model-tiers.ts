/**
 * Helper functions for getting model tier display names
 * Models are configured via environment variables, not hardcoded
 */

// Generic model tier type - consumers provide their own ModelTier type
export type ModelTier = "tier1" | "tier2" | "tier3";

type AIProvider = "openai" | "gemini" | "anthropic";

/**
 * Model configuration that should be read from environment variables
 * This interface defines what the app should provide
 */
export interface ModelTierConfig {
  openai: Record<ModelTier, string>;
  anthropic: Record<ModelTier, string>;
  gemini: Record<ModelTier, string>;
}

/**
 * Build model tier config from environment variables
 * Call this in your app (where process.env is available)
 *
 * @throws {Error} If any required environment variable is not set
 */
export function buildModelConfigFromEnv(): ModelTierConfig {
  // Helper to get required env var
  const getRequiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        `Missing required environment variable: ${key}\n` +
          `Please set this in your .env.local file.\n` +
          `Example: ${key}=model-name`,
      );
    }
    return value;
  };

  return {
    openai: {
      tier1: getRequiredEnv("OPENAI_MODEL_TIER_1"),
      tier2: getRequiredEnv("OPENAI_MODEL_TIER_2"),
      tier3: getRequiredEnv("OPENAI_MODEL_TIER_3"),
    },
    anthropic: {
      tier1: getRequiredEnv("ANTHROPIC_MODEL_TIER_1"),
      tier2: getRequiredEnv("ANTHROPIC_MODEL_TIER_2"),
      tier3: getRequiredEnv("ANTHROPIC_MODEL_TIER_3"),
    },
    gemini: {
      tier1: getRequiredEnv("GEMINI_MODEL_TIER_1"),
      tier2: getRequiredEnv("GEMINI_MODEL_TIER_2"),
      tier3: getRequiredEnv("GEMINI_MODEL_TIER_3"),
    },
  };
}

/**
 * Get the display label for a model tier with actual model name
 */
export function getModelTierName(
  config: ModelTierConfig,
  provider: AIProvider,
  tier: ModelTier,
): string {
  return config[provider][tier];
}

/**
 * Get all tier options for a provider with display names
 */
export function getProviderTierOptions(
  config: ModelTierConfig,
  provider: AIProvider,
) {
  return [
    {
      value: "tier1" as ModelTier,
      label: `Tier 1: ${getModelTierName(config, provider, "tier1")} (cheapest)`,
      description: "Fastest & most affordable",
    },
    {
      value: "tier2" as ModelTier,
      label: `Tier 2: ${getModelTierName(config, provider, "tier2")} (balanced)`,
      description: "Best cost-to-quality ratio",
    },
    {
      value: "tier3" as ModelTier,
      label: `Tier 3: ${getModelTierName(config, provider, "tier3")} (premium)`,
      description: "Highest quality outcomes",
    },
  ];
}
