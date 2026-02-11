/**
 * App-specific model configuration
 * Single source of truth from environment variables
 */

import { buildModelConfigFromEnv } from "@web3web4/ai-core/model-tiers";

// Build model config once from environment variables
// This ensures UI and runtime use the same model names
export const MODEL_CONFIG = buildModelConfigFromEnv();
