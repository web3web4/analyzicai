/**
 * Helper functions for getting model tier display names
 * Note: Model names are hardcoded here to match server-side env vars
 * This avoids env var duplication while showing actual names to users
 */

// Generic model tier type - consumers provide their own ModelTier type
export type ModelTier = "tier1" | "tier2" | "tier3";

type AIProvider = "openai" | "gemini" | "anthropic";

// Model names matching the server-side env vars
const MODEL_NAMES: Record<AIProvider, Record<ModelTier, string>> = {
  openai: {
    tier1: "gpt-5-nano",
    tier2: "gpt-4.5",
    tier3: "gpt-5.2",
  },
  anthropic: {
    tier1: "claude-3-haiku-20240307",
    tier2: "claude-3-5-sonnet",
    tier3: "claude-sonnet-4-5",
  },
  gemini: {
    tier1: "gemini-2.0-flash-lite",
    tier2: "gemini-2.0-flash",
    tier3: "gemini-pro-latest",
  },
};

/**
 * Get the display label for a model tier with actual model name
 */
export function getModelTierName(
  provider: AIProvider,
  tier: ModelTier,
): string {
  return MODEL_NAMES[provider][tier];
}

/**
 * Get all tier options for a provider with display names
 */
export function getProviderTierOptions(provider: AIProvider) {
  return [
    {
      value: "tier1" as ModelTier,
      label: `Tier 1: ${getModelTierName(provider, "tier1")} (cheapest)`,
      description: "Fastest & most affordable",
    },
    {
      value: "tier2" as ModelTier,
      label: `Tier 2: ${getModelTierName(provider, "tier2")} (balanced)`,
      description: "Best cost-to-quality ratio",
    },
    {
      value: "tier3" as ModelTier,
      label: `Tier 3: ${getModelTierName(provider, "tier3")} (premium)`,
      description: "Highest quality outcomes",
    },
  ];
}
