/**
 * App-specific model configuration
 * Fetches model names from Supabase database
 */

import { createBrowserClient } from "@web3web4/shared-platform";
import {
  fetchModelConfigFromDB,
  ModelTierConfig,
} from "@web3web4/ai-core/model-tiers";

// Cache for model configuration
let _modelConfig: ModelTierConfig | null = null;
let _fetchPromise: Promise<ModelTierConfig> | null = null;

/**
 * Get model configuration from database (cached)
 */
export async function getModelConfig(): Promise<ModelTierConfig> {
  // Return cached config if available
  if (_modelConfig) {
    return _modelConfig;
  }

  // If already fetching, return the same promise
  if (_fetchPromise) {
    return _fetchPromise;
  }

  // Fetch from database
  _fetchPromise = (async () => {
    const supabase = createBrowserClient();
    const config = await fetchModelConfigFromDB(supabase);
    _modelConfig = config;
    _fetchPromise = null;
    return config;
  })();

  return _fetchPromise;
}

// For synchronous access in components (will be populated after first fetch)
export const MODEL_CONFIG = new Proxy({} as ModelTierConfig, {
  get(target, prop) {
    if (_modelConfig) {
      return _modelConfig[prop as keyof ModelTierConfig];
    }
    // Trigger fetch if not yet loaded
    getModelConfig();
    return undefined;
  },
});
