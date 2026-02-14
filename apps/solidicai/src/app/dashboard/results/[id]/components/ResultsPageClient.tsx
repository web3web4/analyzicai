"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@web3web4/shared-platform";
import { Loader2, Shield, Zap, Code } from "lucide-react";

interface AnalysisStatus {
  analysis: {
    id: string;
    status: string;
    final_score: number | null;
    created_at: string;
    providers_used: string[];
    master_provider: string;
  };
  responses: {
    v1Count: number;
    v2Count: number;
    hasSynthesis: boolean;
  };
  progress: number;
}

interface ResultsPageClientProps {
  analysisId: string;
  initialStatus: string;
  children: React.ReactNode;
}

export function ResultsPageClient({
  analysisId,
  initialStatus,
  children,
}: ResultsPageClientProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("v1_initial");
  const [providerCounts, setProviderCounts] = useState({ v1: 0, v2: 0, synthesis: false });
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isPolling, setIsPolling] = useState(
    initialStatus === "pending" || initialStatus === "processing"
  );

  // Rotate icons every 2 seconds
  useEffect(() => {
    if (!isPolling) return;

    const rotationTimer = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % 3);
    }, 2000);

    return () => clearInterval(rotationTimer);
  }, [isPolling]);

  // Poll for status updates
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis-status/${analysisId}`);
        if (!response.ok) {
          console.error("Failed to fetch analysis status");
          return;
        }

        const data: AnalysisStatus = await response.json();
        setStatus(data.analysis.status);
        setProgress(data.progress);
        setProviderCounts({
          v1: data.responses.v1Count,
          v2: data.responses.v2Count,
          synthesis: data.responses.hasSynthesis,
        });

        // Determine current step
        if (data.responses.hasSynthesis) {
          setCurrentStep("v3_synthesis");
        } else if (data.responses.v2Count > 0) {
          setCurrentStep("v2_rethink");
        } else if (data.responses.v1Count > 0) {
          setCurrentStep("v1_initial");
        }

        // If the analysis is complete or failed, stop polling and refresh the page
        if (
          data.analysis.status === "completed" ||
          data.analysis.status === "partial" ||
          data.analysis.status === "failed"
        ) {
          setIsPolling(false);
          // Refresh the page to get the latest data from the server
          router.refresh();
        }
      } catch (error) {
        console.error("Error polling analysis status:", error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [analysisId, isPolling, router]);

  // Show loading state while analysis is in progress
  if (isPolling && (status === "pending" || status === "processing")) {
    const getStepMessage = () => {
      if (currentStep === "v1_initial") {
        return `Running initial analysis (${providerCounts.v1} providers completed)...`;
      } else if (currentStep === "v2_rethink") {
        return `Cross-checking results (${providerCounts.v2} providers completed)...`;
      } else if (currentStep === "v3_synthesis") {
        return "Synthesizing final report...";
      }
      return "Initializing analysis...";
    };

    const analysisTypes = [
      { icon: Shield, label: "Security", color: "text-red-400", bgColor: "bg-red-500/10" },
      { icon: Zap, label: "Gas", color: "text-blue-400", bgColor: "bg-blue-500/10" },
      { icon: Code, label: "Quality", color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
    ];

    return (
      <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center space-y-8">
            {/* Main progress circle */}
            <div className="flex justify-center">
              <div className="relative">
                <svg className="w-40 h-40 transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-white/10"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
                    className="text-cyan-500 transition-all duration-500 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-400">
                      {progress}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Step {currentStep === "v3_synthesis" ? "3" : currentStep === "v2_rethink" ? "2" : "1"}/3
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status message */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">Analyzing Smart Contract</h2>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <p>{getStepMessage()}</p>
              </div>
            </div>

            {/* Rotating analysis indicators */}
            <div className="flex justify-center gap-6">
              {analysisTypes.map((item, index) => {
                const Icon = item.icon;
                const isActive = index === rotationIndex;
                return (
                  <div
                    key={item.label}
                    className={`flex flex-col items-center gap-2 transition-all duration-500 ${
                      isActive ? "scale-110" : "opacity-40 scale-95"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive 
                          ? `${item.bgColor} ring-2 ring-cyan-500/50 shadow-lg shadow-cyan-500/20` 
                          : "bg-white/5"
                      }`}
                    >
                      <Icon className={`w-6 h-6 ${item.color} ${isActive ? "animate-pulse" : ""}`} />
                    </div>
                    <span className={`text-xs transition-colors duration-500 ${
                      isActive ? "text-gray-300" : "text-gray-600"
                    }`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Animated progress bar */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden relative">
                {/* Actual progress */}
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
                {/* Animated shimmer effect for activity indication */}
                {progress < 100 && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Step {currentStep === "v3_synthesis" ? "3" : currentStep === "v2_rethink" ? "2" : "1"} of 3</span>
                <span>{progress}% Complete</span>
              </div>
            </div>

            {/* Info */}
            <div className="text-sm text-gray-500 space-y-1">
              <p>Running comprehensive security audit</p>
              <p className="font-mono text-gray-600">
                ID: {analysisId.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>

        {/* Add shimmer animation */}
        <style jsx>{`
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(300%);
            }
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
        `}</style>
      </div>
    );
  }

  // Once analysis is complete or if it was already complete, show the results
  return <>{children}</>;
}
