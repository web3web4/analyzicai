"use client";

import { useState, useEffect } from "react";

type AIProvider = "openai" | "gemini" | "anthropic";
type ModelTier = "tier1" | "tier2" | "tier3";

export interface ModelTierConfig {
  openai: {
    tier1: string;
    tier2: string;
    tier3: string;
  };
  anthropic: {
    tier1: string;
    tier2: string;
    tier3: string;
  };
  gemini: {
    tier1: string;
    tier2: string;
    tier3: string;
  };
}

interface UseProviderSelectionOptions {
  defaultProvider?: AIProvider;
  getModelConfig?: () => Promise<ModelTierConfig>;
}

export function useProviderSelection(
  options: UseProviderSelectionOptions = {},
) {
  const { defaultProvider = "anthropic", getModelConfig } = options;

  const [selectedProviders, setSelectedProviders] = useState<AIProvider[]>([
    defaultProvider,
  ]);
  const [masterProvider, setMasterProvider] = useState<AIProvider>(
    (process.env.NEXT_PUBLIC_DEFAULT_MASTER_PROVIDER as AIProvider) ||
      defaultProvider,
  );
  const [providerModelTiers, setProviderModelTiers] = useState<
    Record<AIProvider, ModelTier>
  >({
    openai: "tier1",
    gemini: "tier1",
    anthropic: "tier1",
  });
  const [masterModelTier, setMasterModelTier] = useState<ModelTier>("tier1");
  const [modelConfig, setModelConfig] = useState<ModelTierConfig | null>(null);
  const [error, setError] = useState("");

  // Load model configuration from database on mount
  useEffect(() => {
    if (getModelConfig) {
      getModelConfig()
        .then(setModelConfig)
        .catch((err) => {
          console.error("Failed to load model config:", err);
          setError(
            "Failed to load model configuration. Please refresh the page.",
          );
        });
    }
  }, [getModelConfig]);

  function toggleProvider(providerId: AIProvider) {
    setSelectedProviders((prev) => {
      if (prev.includes(providerId)) {
        // Don't allow deselecting the last provider
        if (prev.length === 1) {
          return prev;
        }

        const newProviders = prev.filter((p) => p !== providerId);

        // If removing master, auto-assign to first remaining provider
        if (providerId === masterProvider && newProviders.length > 0) {
          setMasterProvider(newProviders[0]);
        }

        return newProviders;
      } else {
        const newProviders = [...prev, providerId];

        // If adding first provider, make it master
        if (prev.length === 0) {
          setMasterProvider(providerId);
        }

        return newProviders;
      }
    });
  }

  function handleMasterChange(providerId: AIProvider) {
    setMasterProvider(providerId);
  }

  function handleModelTierChange(providerId: AIProvider, tier: ModelTier) {
    setProviderModelTiers((prev) => ({
      ...prev,
      [providerId]: tier,
    }));
  }

  function handleMasterModelTierChange(tier: ModelTier) {
    setMasterModelTier(tier);
  }

  return {
    selectedProviders,
    masterProvider,
    masterModelTier,
    providerModelTiers,
    modelConfig,
    error,
    setError,
    toggleProvider,
    handleMasterChange,
    handleModelTierChange,
    handleMasterModelTierChange,
    setProviderModelTiers,
  };
}
