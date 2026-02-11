"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Play,
  Github,
  Code,
  CheckCircle,
  AlertTriangle,
  Zap,
  Shield,
  FileText,
} from "lucide-react";
import { Logo } from "@web3web4/ui-library";

export default function AnalyzePage() {
  const [inputType, setInputType] = useState<"code" | "github">("code");
  const [code, setCode] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [providers, setProviders] = useState<string[]>([
    "openai",
    "gemini",
    "anthropic",
  ]);

  const handleProviderToggle = (provider: string) => {
    if (providers.includes(provider)) {
      setProviders(providers.filter((p) => p !== provider));
    } else {
      setProviders([...providers, provider]);
    }
  };

  const handleAnalyze = async () => {
    if (!code && !githubUrl) return;

    setIsAnalyzing(true);
    setResult(null);

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
          providers,
          masterProvider: "openai", // Default master
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("Analysis failed. See console for details.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-mono text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Logo prefix="Solidic" suffix="AI" size="md" />
          </div>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Input Section */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                New Analysis
              </h1>
              <p className="text-gray-400">
                Identify vulnerabilities and optimize gas usage.
              </p>
            </div>

            {/* Input Type Selector */}
            <div className="flex gap-4 border-b border-white/10 pb-4">
              <button
                onClick={() => setInputType("code")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                  inputType === "code"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Code className="h-4 w-4" />
                Paste Code
              </button>
              <button
                onClick={() => setInputType("github")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                  inputType === "github"
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Github className="h-4 w-4" />
                GitHub URL
              </button>
            </div>

            {/* Input Area */}
            <div className="space-y-4">
              {inputType === "code" ? (
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Paste your Solidity contract here..."
                  className="w-full h-[400px] bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm text-gray-300 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              ) : (
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">
                    GitHub Valid URL
                  </label>
                  <input
                    type="text"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username/repo/blob/main/contracts/Token.sol"
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  />
                  <p className="text-xs text-gray-500">
                    Must point to a specific .sol file
                  </p>
                </div>
              )}
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-300">
                Analysis Engine
              </h3>
              <div className="flex flex-wrap gap-3">
                {["openai", "gemini", "anthropic"].map((provider) => (
                  <button
                    key={provider}
                    onClick={() => handleProviderToggle(provider)}
                    className={`px-4 py-2 rounded-full border text-xs font-mono transition-all ${
                      providers.includes(provider)
                        ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-400"
                        : "border-white/10 bg-white/5 text-gray-500 hover:border-white/20"
                    }`}
                  >
                    {provider.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={
                isAnalyzing || (inputType === "code" ? !code : !githubUrl)
              }
              className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold tracking-wide hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  Start Analysis
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="relative">
            {result ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold">Analysis Report</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Generated by Solidic.ai Engine
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-cyan-400">
                      {result.finalScore}/100
                    </div>
                    <div className="text-xs uppercase tracking-wider text-gray-500">
                      Safety Score
                    </div>
                  </div>
                </div>

                {/* Synthesis Result */}
                {result.results &&
                  result.results.length > 0 &&
                  (() => {
                    const synthesis =
                      result.results.find(
                        (r: any) => r.step === "v3_synthesis",
                      ) || result.results[0];
                    const data = synthesis.result;

                    return (
                      <div className="space-y-8">
                        {/* Summary */}
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                          <h3 className="flex items-center gap-2 font-bold mb-4">
                            <FileText className="h-5 w-5 text-gray-400" />
                            Executive Summary
                          </h3>
                          <p className="text-gray-300 leading-relaxed text-sm">
                            {data.summary}
                          </p>
                        </div>

                        {/* Security Findings */}
                        <div className="space-y-4">
                          <h3 className="flex items-center gap-2 font-bold text-red-400">
                            <Shield className="h-5 w-5" />
                            Security Vulnerabilities
                          </h3>
                          {data.securityFindings.map(
                            (finding: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-red-500/5 border border-red-500/20 rounded-xl p-4"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-bold text-red-300">
                                    {finding.title}
                                  </h4>
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                      finding.severity === "critical"
                                        ? "bg-red-500 text-white"
                                        : finding.severity === "high"
                                          ? "bg-orange-500 text-white"
                                          : "bg-yellow-500/20 text-yellow-500"
                                    }`}
                                  >
                                    {finding.severity}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-400 mb-3">
                                  {finding.description}
                                </p>
                                <div className="bg-black/50 rounded p-2 font-mono text-xs text-red-200/70">
                                  Line {finding.line}: {finding.snippet}
                                </div>
                              </div>
                            ),
                          )}
                          {data.securityFindings.length === 0 && (
                            <div className="p-4 border border-green-500/20 bg-green-500/5 rounded-xl text-green-400 text-sm flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              No critical vulnerabilities detected.
                            </div>
                          )}
                        </div>

                        {/* Gas Optimizations */}
                        <div className="space-y-4">
                          <h3 className="flex items-center gap-2 font-bold text-blue-400">
                            <Zap className="h-5 w-5" />
                            Gas Optimizations
                          </h3>
                          {data.gasOptimizations.map(
                            (opt: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4"
                              >
                                <h4 className="font-bold text-blue-300 mb-1">
                                  {opt.title}
                                </h4>
                                <p className="text-sm text-gray-400 mb-2">
                                  {opt.description}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-blue-400/70 font-mono">
                                  <span>
                                    Est. Savings: {opt.estimatedSavings}
                                  </span>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 border border-white/5 rounded-2xl bg-white/[0.02] min-h-[500px]">
                <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                  <Code className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Ready to Analyze
                </h3>
                <p className="max-w-xs mx-auto">
                  Paste your smart contract code or provide a GitHub URL to
                  start the deep-scan.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
