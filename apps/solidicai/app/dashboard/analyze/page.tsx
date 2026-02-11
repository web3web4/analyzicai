"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Logo } from "@web3web4/ui-library";
import { FileCode, Github, Loader2, AlertCircle } from "lucide-react";

export default function AnalyzePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputType, setInputType] = useState<"code" | "github">("code");
  const [code, setCode] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

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
          // Default providers and config can be set here or handled in API
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

        <div className="glass-card rounded-2xl border border-white/10 bg-white/5 p-8 max-w-3xl mx-auto">
          {/* Input Type Selector */}
          <div className="flex bg-black/40 p-1 rounded-xl mb-8 w-fit mx-auto border border-white/5">
            <button
              onClick={() => setInputType("code")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                inputType === "code"
                  ? "bg-cyan-500/20 text-cyan-400 shadow-sm border border-cyan-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileCode className="h-4 w-4" />
              Paste Code
            </button>
            <button
              onClick={() => setInputType("github")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                inputType === "github"
                  ? "bg-cyan-500/20 text-cyan-400 shadow-sm border border-cyan-500/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Github className="h-4 w-4" />
              GitHub Repo
            </button>
          </div>

          {/* Input Area */}
          <div className="mb-8">
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
                  <p>
                    Enter the URL to a specific solidity file or a repository
                    root. For public repositories only.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit Button */}
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
              <>
                <Logo
                  prefix=""
                  suffix=""
                  size="sm"
                  className="opacity-0 w-0 h-0"
                />{" "}
                {/* Hidden trigger for optional branding usage or just use icon */}
                Analyze Contract Security
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            Powered by a multi-agent consensus system: GPT-4, Claude 3.5, and
            Gemini 1.5 Pro.
          </p>
        </div>
      </main>
    </div>
  );
}
