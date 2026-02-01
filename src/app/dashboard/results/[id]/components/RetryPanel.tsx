"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RetryPanelProps {
  analysisId: string;
  failedProviders: string[];
  synthesisFailed: boolean;
  allProviders?: string[];
  masterProvider?: string;
}

type AIProvider = "openai" | "gemini" | "anthropic";

const PROVIDER_INFO: Record<AIProvider, { name: string; description: string }> = {
  openai: {
    name: "OpenAI GPT",
    description: "Best for detailed observations",
  },
  gemini: {
    name: "Gemini Pro Vision",
    description: "Great for visual patterns",
  },
  anthropic: {
    name: "Claude 3 Sonnet",
    description: "Excellent for accessibility",
  },
};

export function RetryPanel({
  analysisId,
  failedProviders,
  synthesisFailed,
  allProviders = ["openai", "gemini", "anthropic"],
  masterProvider = "openai",
}: RetryPanelProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");
  const [retrySuccess, setRetrySuccess] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string>>(
    Object.fromEntries(failedProviders.map(p => [p, p]))
  );
  const [selectedSynthesisProvider, setSelectedSynthesisProvider] = useState(masterProvider);
  const router = useRouter();

  const toggleProviderSelection = (failedProvider: string, newProvider: string) => {
    setSelectedProviders(prev => ({
      ...prev,
      [failedProvider]: newProvider,
    }));
  };

  const handleRetryProviders = async () => {
    if (failedProviders.length === 0) return;

    setIsRetrying(true);
    setRetryError("");
    setRetrySuccess("");

    try {
      // Build retry configuration with selected providers
      const retryConfig = Object.entries(selectedProviders).map(([failed, selected]) => ({
        originalProvider: failed,
        retryProvider: selected,
      }));

      const response = await fetch("/api/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          failedProviders,
          retryProviders: retryConfig,
          retryStep: "v1_initial",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Retry failed");
      }

      // Show success message briefly before refresh
      setRetrySuccess(data.message || "Retry successful! Refreshing...");
      
      // Refresh the page after a short delay to show the success message
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Retry error:", error);
      setRetryError(error instanceof Error ? error.message : "Retry failed");
      setIsRetrying(false);
    }
  };

  const handleRetrySynthesis = async () => {
    setIsRetrying(true);
    setRetryError("");
    setRetrySuccess("");

    try {
      const response = await fetch("/api/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          failedProviders: [],
          retryStep: "v3_synthesis",
          newMasterProvider: selectedSynthesisProvider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Retry failed");
      }

      // Show success message briefly before refresh
      setRetrySuccess(data.message || "Retry successful! Refreshing...");
      
      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error("Retry error:", error);
      setRetryError(error instanceof Error ? error.message : "Retry failed");
      setIsRetrying(false);
    }
  };

  if (failedProviders.length === 0 && !synthesisFailed) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 border-2 border-warning/30">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
          <span className="text-xl">🔄</span>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Retry Failed Steps</h3>
          
          {failedProviders.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-muted mb-3">
                The following providers failed during initial analysis. You can retry with the same provider or choose a different one:
              </p>
              
              <div className="space-y-3 mb-4">
                {failedProviders.map((failedProvider) => (
                  <div
                    key={failedProvider}
                    className="p-4 rounded-lg bg-surface-light border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded bg-error/10 text-error text-xs font-medium">
                          Failed
                        </span>
                        <span className="font-medium text-sm">
                          {PROVIDER_INFO[failedProvider as AIProvider]?.name || failedProvider}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs text-muted block">
                        Select provider for retry:
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {allProviders.map((provider) => {
                          const isSelected = selectedProviders[failedProvider] === provider;
                          const info = PROVIDER_INFO[provider as AIProvider];
                          const isSameProvider = provider === failedProvider;
                          
                          return (
                            <label
                              key={provider}
                              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                isSelected
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`retry-${failedProvider}`}
                                value={provider}
                                checked={isSelected}
                                onChange={() => toggleProviderSelection(failedProvider, provider)}
                                className="w-4 h-4 accent-primary"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {info?.name || provider}
                                  </span>
                                  {isSameProvider && (
                                    <span className="text-xs text-muted">(retry same)</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted mt-0.5">
                                  {info?.description || "AI provider"}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleRetryProviders}
                disabled={isRetrying}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Retrying...
                  </span>
                ) : (
                  `Retry with Selected Provider${failedProviders.length > 1 ? "s" : ""}`
                )}
              </button>
            </div>
          )}

          {synthesisFailed && (
            <div className="mb-4">
              <p className="text-sm text-muted mb-3">
                The synthesis step failed. You can retry combining the successful provider results with a master provider of your choice.
              </p>
              
              <div className="p-4 rounded-lg bg-surface-light border border-border mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-error/10 text-error text-xs font-medium">
                      Failed
                    </span>
                    <span className="font-medium text-sm">
                      Synthesis by {PROVIDER_INFO[masterProvider as AIProvider]?.name || masterProvider}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-muted block">
                    Select master provider for synthesis retry:
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {allProviders.map((provider) => {
                      const isSelected = selectedSynthesisProvider === provider;
                      const info = PROVIDER_INFO[provider as AIProvider];
                      const isSameProvider = provider === masterProvider;
                      
                      return (
                        <label
                          key={provider}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <input
                            type="radio"
                            name="synthesis-master"
                            value={provider}
                            checked={isSelected}
                            onChange={() => setSelectedSynthesisProvider(provider)}
                            className="w-4 h-4 accent-primary"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {info?.name || provider}
                              </span>
                              {isSameProvider && (
                                <span className="text-xs text-muted">(retry same)</span>
                              )}
                            </div>
                            <p className="text-xs text-muted mt-0.5">
                              {info?.description || "AI provider"}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleRetrySynthesis}
                disabled={isRetrying}
                className="btn-primary px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Retrying...
                  </span>
                ) : (
                  "Retry Synthesis with Selected Provider"
                )}
              </button>
            </div>
          )}

          {retrySuccess && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-success/10 border border-success/20 text-success text-sm flex items-center gap-2">
              <span>✓</span>
              {retrySuccess}
            </div>
          )}
          
          {retryError && (
            <div className="mt-3 px-3 py-2 rounded-lg bg-error/10 text-error text-sm">
              {retryError}
            </div>
          )}

          <div className="mt-3 p-3 rounded-lg bg-surface-light/50 border border-border">
            <p className="text-xs text-muted">
              <strong>Note:</strong> Retrying will use additional AI API credits. 
              {failedProviders.length > 0 && selectedProviders && 
                Object.values(selectedProviders).some(p => !failedProviders.includes(p)) && (
                  <span className="block mt-1">
                    💡 You selected different provider(s) - this may give different insights!
                  </span>
                )}
              {synthesisFailed && selectedSynthesisProvider !== masterProvider && (
                <span className="block mt-1">
                  💡 Switching master provider from {PROVIDER_INFO[masterProvider as AIProvider]?.name} to {PROVIDER_INFO[selectedSynthesisProvider as AIProvider]?.name}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
