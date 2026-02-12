/**
 * Helper functions for getting model tier display names
 * Models are now fetched from database instead of environment variables
 */

// Generic model tier type - consumers provide their own ModelTier type
export type ModelTier = "tier1" | "tier2" | "tier3";

type AIProvider = "openai" | "gemini" | "anthropic";

/**
 * Model configuration that should be read from database
 */
export interface ModelTierConfig {
  openai: Record<ModelTier, string>;
  anthropic: Record<ModelTier, string>;
  gemini: Record<ModelTier, string>;
}

/**
 * Fetch model configurations from Supabase database
 * @param supabaseClient - Supabase client instance
 */
export async function fetchModelConfigFromDB(
  supabaseClient: any,
): Promise<ModelTierConfig> {
  const { data, error } = await supabaseClient
    .from("model_configurations")
    .select("provider, tier, model_name")
    .eq("is_active", true);

  if (error) {
    throw new Error(`Failed to fetch model configurations: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("No model configurations found in database");
  }

  // Build config object from database rows
  const config: ModelTierConfig = {
    openai: {} as Record<ModelTier, string>,
    anthropic: {} as Record<ModelTier, string>,
    gemini: {} as Record<ModelTier, string>,
  };

  for (const row of data) {
    config[row.provider as AIProvider][row.tier as ModelTier] = row.model_name;
  }

  // Validate all tiers are present for all providers
  const providers: AIProvider[] = ["openai", "anthropic", "gemini"];
  const tiers: ModelTier[] = ["tier1", "tier2", "tier3"];

  for (const provider of providers) {
    for (const tier of tiers) {
      if (!config[provider][tier]) {
        throw new Error(`Missing model configuration for ${provider} ${tier}`);
      }
    }
  }

  return config;
}

/**
 * DEPRECATED: Build model tier config from environment variables
 * Use fetchModelConfigFromDB instead
 *
 * @deprecated This is kept for backwards compatibility only
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
      label: `Tier 1: ${getModelTierName(
        config,
        provider,
        "tier1",
      )} (cheapest)`,
      description: "Fastest & most affordable",
    },
    {
      value: "tier2" as ModelTier,
      label: `Tier 2: ${getModelTierName(
        config,
        provider,
        "tier2",
      )} (balanced)`,
      description: "Best cost-to-quality ratio",
    },
    {
      value: "tier3" as ModelTier,
      label: `Tier 3: ${getModelTierName(config, provider, "tier3")} (premium)`,
      description: "Highest quality outcomes",
    },
  ];
}
