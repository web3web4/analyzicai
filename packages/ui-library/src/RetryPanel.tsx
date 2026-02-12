"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AIProvider = "openai" | "gemini" | "anthropic";
type Variant = "uxic" | "solidic";

interface RetryPanelProps {
  analysisId: string;
  failedProviders: string[];
  synthesisFailed: boolean;
  allProviders?: string[];
  masterProvider?: string;
  variant?: Variant;
  retryApiPath?: string;
  codeSize?: number; // For contract analysis - to show truncation warning
  showTruncationOption?: boolean; // Whether to show code truncation option
}

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
    description: "Excellent for comprehensive analysis",
  },
};

const VARIANT_STYLES = {
  uxic: {
    card: "glass-card",
    border: "border-2 border-warning/30",
    button: "btn-primary",
    iconBg: "bg-warning/20",
    providerBorder: "border-border",
    selectedBorder: "border-primary bg-primary/10",
    hoverBorder: "hover:border-primary/50",
  },
  solidic: {
    card: "bg-white/5 border border-white/10",
    border: "border-cyan-500/30",
    button: "bg-cyan-500 hover:bg-cyan-600 text-white",
    iconBg: "bg-cyan-500/20",
    providerBorder: "border-white/10",
    selectedBorder: "border-cyan-500 bg-cyan-500/10",
    hoverBorder: "hover:border-cyan-500/50",
  },
};

export function RetryPanel({
  analysisId,
  failedProviders,
  synthesisFailed,
  allProviders = ["openai", "gemini", "anthropic"],
  masterProvider = "openai",
  variant = "uxic",
  retryApiPath = "/api/retry",
  codeSize = 0,
  showTruncationOption = false,
}: RetryPanelProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState("");
  const [retrySuccess, setRetrySuccess] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string>>(
    Object.fromEntries(failedProviders.map(p => [p, p]))
  );
  const [selectedSynthesisProvider, setSelectedSynthesisProvider] = useState(masterProvider);
  const [truncateCodeForSynthesis, setTruncateCodeForSynthesis] = useState(false);
  const router = useRouter();
  const styles = VARIANT_STYLES[variant];

  // Check if code is large (for contract analysis)
  const isLargeCode = codeSize > 15000;
  const shouldShowTruncationCheckbox = showTruncationOption && isLargeCode && variant === "solidic";

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

      const response = await fetch(retryApiPath, {
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
      const response = await fetch(retryApiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId,
          failedProviders: [],
          retryStep: "v3_synthesis",
          newMasterProvider: selectedSynthesisProvider,
          truncateCodeForSynthesis: shouldShowTruncationCheckbox ? truncateCodeForSynthesis : undefined,
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
    <div className={`${styles.card} ${styles.border} rounded-2xl p-6`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
          <span className="text-xl">🔄</span>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold mb-2">Retry Failed Steps</h3>
          
          {failedProviders.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-3">
                The following providers failed during initial analysis. You can retry with the same provider or choose a different one:
              </p>
              
              <div className="space-y-3 mb-4">
                {failedProviders.map((failedProvider) => (
                  <div
                    key={failedProvider}
                    className={`p-4 rounded-lg ${variant === 'uxic' ? 'bg-surface-light' : 'bg-black/30'} border ${styles.providerBorder}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded ${variant === 'uxic' ? 'bg-error/10 text-error' : 'bg-red-500/20 text-red-400'} text-xs font-medium`}>
                          Failed
                        </span>
                        <span className="font-medium text-sm">
                          {PROVIDER_INFO[failedProvider as AIProvider]?.name || failedProvider}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs text-gray-400 block">
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
                                  ? styles.selectedBorder
                                  : `${styles.providerBorder} ${styles.hoverBorder}`
                              }`}
                            >
                              <input
                                type="radio"
                                name={`retry-${failedProvider}`}
                                value={provider}
                                checked={isSelected}
                                onChange={() => toggleProviderSelection(failedProvider, provider)}
                                className={`w-4 h-4 ${variant === 'uxic' ? 'accent-primary' : 'accent-cyan-500'}`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {info?.name || provider}
                                  </span>
                                  {isSameProvider && (
                                    <span className="text-xs text-gray-400">(retry same)</span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
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
                className={`${styles.button} px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
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
              <p className="text-sm text-gray-400 mb-3">
                The synthesis step failed. You can retry combining the successful provider results with a master provider of your choice.
              </p>
              
              <div className={`p-4 rounded-lg ${variant === 'uxic' ? 'bg-surface-light' : 'bg-black/30'} border ${styles.providerBorder} mb-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded ${variant === 'uxic' ? 'bg-error/10 text-error' : 'bg-red-500/20 text-red-400'} text-xs font-medium`}>
                      Failed
                    </span>
                    <span className="font-medium text-sm">
                      Synthesis by {PROVIDER_INFO[masterProvider as AIProvider]?.name || masterProvider}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 block">
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
                              ? styles.selectedBorder
                              : `${styles.providerBorder} ${styles.hoverBorder}`
                          }`}
                        >
                          <input
                            type="radio"
                            name="synthesis-master"
                            value={provider}
                            checked={isSelected}
                            onChange={() => setSelectedSynthesisProvider(provider)}
                            className={`w-4 h-4 ${variant === 'uxic' ? 'accent-primary' : 'accent-cyan-500'}`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {info?.name || provider}
                              </span>
                              {isSameProvider && (
                                <span className="text-xs text-gray-400">(retry same)</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {info?.description || "AI provider"}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Truncation Option for Large Code */}
              {shouldShowTruncationCheckbox && (
                <div className="mb-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl flex-shrink-0">⚠️</span>
                    <div className="flex-1">
                      <h4 className="text-amber-400 font-semibold text-sm mb-2">
                        Large Contract Detected
                      </h4>
                      <p className="text-amber-200/80 text-sm mb-3">
                        Your contract is {codeSize.toLocaleString()} characters.
                        Including the full code in synthesis may cause token overflow.
                      </p>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={truncateCodeForSynthesis}
                          onChange={(e) => setTruncateCodeForSynthesis(e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-amber-500/30 bg-amber-500/10 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 focus:ring-2 transition-all cursor-pointer"
                        />
                        <span className="text-amber-100 text-sm flex-1">
                          <strong className="font-semibold">
                            Truncate code in synthesis retry
                          </strong>{" "}
                          (Limits to 15,000 chars. Faster and prevents token overflow,
                          but may slightly reduce accuracy.)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handleRetrySynthesis}
                disabled={isRetrying}
                className={`${styles.button} px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
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
            <div className={`mt-3 px-3 py-2 rounded-lg ${variant === 'uxic' ? 'bg-success/10 border border-success/20 text-success' : 'bg-green-500/10 border border-green-500/20 text-green-400'} text-sm flex items-center gap-2`}>
              <span>✓</span>
              {retrySuccess}
            </div>
          )}
          
          {retryError && (
            <div className={`mt-3 px-3 py-2 rounded-lg ${variant === 'uxic' ? 'bg-error/10 text-error' : 'bg-red-500/10 text-red-400'} text-sm`}>
              {retryError}
            </div>
          )}

          <div className={`mt-3 p-3 rounded-lg ${variant === 'uxic' ? 'bg-surface-light/50 border border-border' : 'bg-white/5 border border-white/10'}`}>
            <p className="text-xs text-gray-400">
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
