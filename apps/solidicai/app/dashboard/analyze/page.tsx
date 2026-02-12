"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import {
  Logo,
  MultiSelectButtonGroup,
  ProviderSelector,
  ApiKeyInput,
  InputTypeToggle,
  GlassCard,
  Provider,
} from "@web3web4/ui-library";
import { FileCode, Github, Loader2, AlertCircle } from "lucide-react";
import { getProviderTierOptions, ModelTierConfig } from "@web3web4/ai-core/model-tiers";
import { getModelConfig } from "@/lib/config/models";

type AIProvider = "openai" | "gemini" | "anthropic";
type ModelTier = "tier1" | "tier2" | "tier3";

export default function AnalyzePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputType, setInputType] = useState<"code" | "github">("code");
  const [code, setCode] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [modelConfig, setModelConfig] = useState<ModelTierConfig | null>(null);

  // Provider selection
  const [selectedProviders, setSelectedProviders] = useState<AIProvider[]>([
    "anthropic",
  ]);
  const [masterProvider, setMasterProvider] = useState<AIProvider>("anthropic");

  // Per-provider model tiers
  const [providerModelTiers, setProviderModelTiers] = useState<
    Record<AIProvider, ModelTier>
  >({
    openai: "tier1",
    gemini: "tier1",
    anthropic: "tier1",
  });

  // User API keys (optional)
  const [userApiKeys, setUserApiKeys] = useState({
    openai: "",
    anthropic: "",
    gemini: "",
  });

  // Code truncation for synthesis (to prevent token overflow)
  const [truncateCodeForSynthesis, setTruncateCodeForSynthesis] =
    useState(false);

  // Load model configuration from database on mount
  useEffect(() => {
    getModelConfig()
      .then(setModelConfig)
      .catch((err) => {
        console.error("Failed to load model config:", err);
        setError("Failed to load model configuration. Please refresh the page.");
      });
  }, []);

  // Contract context (optional but recommended)
  const [contractContext, setContractContext] = useState({
    contractType: [] as string[],
    securityLevel: [] as ("standard" | "high" | "critical")[],
    auditFocus: [] as string[],
    additionalContext: "",
  });

  const providers: Provider[] = [
    {
      id: "openai",
      name: "OpenAI GPT-4",
      description: "Best for detailed vulnerability analysis",
    },
    {
      id: "gemini",
      name: "Gemini 1.5 Pro",
      description: "Great for gas optimization patterns",
    },
    {
      id: "anthropic",
      name: "Claude 3.5 Sonnet",
      description: "Excellent for logic flaw detection",
    },
  ];

  const apiKeyProviders = [
    {
      id: "openai",
      label: "OpenAI API Key",
      placeholder: "sk-...",
    },
    {
      id: "anthropic",
      label: "Anthropic API Key",
      placeholder: "sk-ant-...",
    },
    {
      id: "gemini",
      label: "Google Gemini API Key",
      placeholder: "AI...",
    },
  ];

  function toggleProvider(providerId: string) {
    const pid = providerId as AIProvider;
    setSelectedProviders((prev) => {
      if (prev.includes(pid)) {
        if (prev.length === 1) return prev;
        const newProviders = prev.filter((p) => p !== pid);
        if (pid === masterProvider && newProviders.length > 0) {
          setMasterProvider(newProviders[0]);
        }
        return newProviders;
      } else {
        const newProviders = [...prev, pid];
        if (prev.length === 0) {
          setMasterProvider(pid);
        }
        return newProviders;
      }
    });
  }

  function handleMasterChange(providerId: string) {
    const pid = providerId as AIProvider;
    setMasterProvider(pid);
    if (!selectedProviders.includes(pid)) {
      setSelectedProviders((prev) => [...prev, pid]);
    }
  }

  function handleModelTierChange(providerId: string, tier: string) {
    setProviderModelTiers({
      ...providerModelTiers,
      [providerId]: tier as ModelTier,
    });
  }

  function handleApiKeyChange(provider: string, value: string) {
    setUserApiKeys({
      ...userApiKeys,
      [provider]: value,
    });
  }

  const toggleContractType = (type: string) => {
    setContractContext({
      ...contractContext,
      contractType: contractContext.contractType.includes(type)
        ? contractContext.contractType.filter((t) => t !== type)
        : [...contractContext.contractType, type],
    });
  };

  const toggleSecurityLevel = (level: "standard" | "high" | "critical") => {
    setContractContext({
      ...contractContext,
      securityLevel: contractContext.securityLevel.includes(level)
        ? contractContext.securityLevel.filter((l) => l !== level)
        : [...contractContext.securityLevel, level],
    });
  };

  const toggleAuditFocus = (focus: string) => {
    setContractContext({
      ...contractContext,
      auditFocus: contractContext.auditFocus.includes(focus)
        ? contractContext.auditFocus.filter((f) => f !== focus)
        : [...contractContext.auditFocus, focus],
    });
  };

  const handleAnalyze = async () => {
    if (inputType === "code" && !code.trim()) {
      setError("Please enter Solidity code to analyze.");
      return;
    }
    if (inputType === "github" && !githubUrl.trim()) {
      setError("Please enter a valid GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/analyze-contract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputType,
          code: inputType === "code" ? code : undefined,
          githubUrl: inputType === "github" ? githubUrl : undefined,
          providers: selectedProviders,
          masterProvider,
          providerModelTiers,
          ...(userApiKeys.openai || userApiKeys.anthropic || userApiKeys.gemini
            ? {
                userApiKeys: {
                  ...(userApiKeys.openai && { openai: userApiKeys.openai }),
                  ...(userApiKeys.anthropic && {
                    anthropic: userApiKeys.anthropic,
                  }),
                  ...(userApiKeys.gemini && { gemini: userApiKeys.gemini }),
                },
              }
            : {}),
          ...(Object.keys(contractContext).some(
            (key) =>
              contractContext[key as keyof typeof contractContext]?.length > 0,
          )
            ? { contractContext }
            : {}),
          truncateCodeForSynthesis,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      if (data.analysisId) {
        router.push(`/dashboard/results/${data.analysisId}`);
      } else {
        throw new Error("No analysis ID returned");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold mb-4">New Smart Contract Audit</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Detect security vulnerabilities, gas inefficiencies, and logic flaws
            in your Solidity smart contracts using our multi-agent AI system.
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm max-w-3xl mx-auto">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        )}

        {/* 1. Contract Input */}
        <GlassCard className="max-w-3xl mx-auto mb-8">
          <h2 className="text-lg font-semibold mb-4">1. Add your contract</h2>

          <InputTypeToggle
            options={[
              { id: "code", label: "Paste Code", icon: FileCode },
              { id: "github", label: "GitHub Repo", icon: Github },
            ]}
            selected={inputType}
            onSelect={(id) => setInputType(id as "code" | "github")}
            accentColor="cyan"
          />

          <div className="mt-8">
            {inputType === "code" ? (
              <div className="relative">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Paste your Solidity contract code here..."
                  className="w-full h-80 bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none transition-colors"
                />
                <div className="absolute bottom-4 right-4 text-xs text-gray-500 pointer-events-none">
                  Solidity
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 pr-12 text-gray-300 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors"
                  />
                  <Github className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-sm text-blue-200">
                  <AlertCircle className="h-5 w-5 shrink-0 text-blue-400" />
                  <div>
                    <p className="mb-2">
                      Supports multiple formats for public repositories:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-blue-200/80 ml-2">
                      <li>Specific file: github.com/owner/repo/blob/main/Contract.sol</li>
                      <li>Folder: github.com/owner/repo/tree/main/contracts/</li>
                      <li>Repository root: github.com/owner/repo</li>
                    </ul>
                    <p className="mt-2 text-xs text-blue-200/60">
                      Multiple files will be automatically combined with separators.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        {/* 2. Contract Context */}
        <GlassCard className="max-w-3xl mx-auto mb-8">
          <h2 className="text-lg font-semibold mb-4">
            2. Contract Context (Optional but Recommended)
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Help us provide more targeted feedback by describing your contract's
            purpose and requirements.
          </p>

          <div className="space-y-6">
            <MultiSelectButtonGroup
              label="Contract Type"
              options={[
                { id: "token", label: "Token (ERC20/ERC721)" },
                { id: "defi", label: "DeFi Protocol" },
                { id: "nft", label: "NFT/Marketplace" },
                { id: "dao", label: "DAO/Governance" },
                { id: "bridge", label: "Bridge/Cross-chain" },
                { id: "staking", label: "Staking/Rewards" },
              ]}
              selectedValues={contractContext.contractType}
              onToggle={toggleContractType}
              onSetAll={(values) =>
                setContractContext({ ...contractContext, contractType: values })
              }
            />

            <MultiSelectButtonGroup
              label="Required Security Level"
              options={[
                { id: "standard", label: "Standard" },
                { id: "high", label: "High Value" },
                { id: "critical", label: "Critical Infrastructure" },
              ]}
              selectedValues={contractContext.securityLevel}
              onToggle={toggleSecurityLevel}
              onSetAll={(values) =>
                setContractContext({
                  ...contractContext,
                  securityLevel: values as ("standard" | "high" | "critical")[],
                })
              }
            />

            <MultiSelectButtonGroup
              label="Audit Focus Areas"
              options={[
                { id: "security", label: "Security Vulnerabilities" },
                { id: "gas", label: "Gas Optimization" },
                { id: "logic", label: "Logic Flaws" },
                { id: "reentrancy", label: "Reentrancy" },
                { id: "access", label: "Access Control" },
                { id: "overflow", label: "Integer Overflow/Underflow" },
              ]}
              selectedValues={contractContext.auditFocus}
              onToggle={toggleAuditFocus}
              onSetAll={(values) =>
                setContractContext({ ...contractContext, auditFocus: values })
              }
            />

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Additional Context
              </label>
              <textarea
                value={contractContext.additionalContext}
                onChange={(e) =>
                  setContractContext({
                    ...contractContext,
                    additionalContext: e.target.value,
                  })
                }
                placeholder="Any other relevant information about your contract..."
                rows={4}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-colors resize-none text-sm text-gray-300"
              />
            </div>
          </div>
        </GlassCard>

        {/* 3. Provider Selection */}
        <GlassCard className="max-w-3xl mx-auto mb-8">
          <h2 className="text-lg font-semibold mb-4">3. Select AI providers</h2>
          <p className="text-gray-400 text-sm mb-6">
            Choose which AI models to use. More providers = better consensus.
          </p>

          <ProviderSelector
            providers={providers}
            selectedProviders={selectedProviders}
            masterProvider={masterProvider}
            providerModelTiers={providerModelTiers}
            onToggleProvider={toggleProvider}
            onMasterChange={handleMasterChange}
            onModelTierChange={handleModelTierChange}
            getModelTierOptions={(providerId) =>
              modelConfig
                ? getProviderTierOptions(modelConfig, providerId as AIProvider)
                : []
            }
            accentColor="cyan"
          />
        </GlassCard>

        {/* 4. API Keys */}
        <GlassCard className="max-w-3xl mx-auto mb-8">
          <h2 className="text-lg font-semibold mb-4">
            4. API Keys (Optional)
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Want to use your own API keys? Provide them here.
          </p>

          <ApiKeyInput
            apiKeys={userApiKeys}
            onApiKeyChange={handleApiKeyChange}
            providers={apiKeyProviders}
            accentColor="cyan"
          />
        </GlassCard>

        {/* Submit Button */}
        <div className="max-w-3xl mx-auto">
          {/* Large Code Warning */}
          {inputType === "code" && code.length > 15000 && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-amber-400 font-semibold text-sm mb-2">
                    Large Contract Detected
                  </h3>
                  <p className="text-amber-200/80 text-sm mb-3">
                    Your contract is {code.length.toLocaleString()} characters.
                    Including the full code in the synthesis step may cause
                    token overflow and result in incomplete analysis.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={truncateCodeForSynthesis}
                      onChange={(e) =>
                        setTruncateCodeForSynthesis(e.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 rounded border-amber-500/30 bg-amber-500/10 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 focus:ring-2 transition-all cursor-pointer"
                    />
                    <span className="text-amber-100 text-sm flex-1">
                      <strong className="font-semibold">
                        Truncate code in synthesis step
                      </strong>{" "}
                      (Limits to 15,000 chars. Faster but may reduce synthesis
                      accuracy. Individual provider analyses will still receive
                      the full code.)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 font-bold text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-cyan-900/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Analyzing Smart Contract...
              </>
            ) : (
              "Analyze Contract Security"
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Powered by GPT-4, Claude 3.5, and Gemini 1.5 Pro
          </p>
        </div>
      </main>
    </div>
  );
}
