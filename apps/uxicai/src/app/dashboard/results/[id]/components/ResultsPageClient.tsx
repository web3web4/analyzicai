"use client";

import { useAnalysisProgress } from "@web3web4/shared-platform";
import { Loader2, Eye, Palette, Lightbulb } from "lucide-react";

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
  const {
    status,
    progress,
    currentStep,
    providerCounts,
    rotationIndex,
    isPolling,
  } = useAnalysisProgress(analysisId, initialStatus);

  // Show loading state while analysis is in progress
  if (isPolling) {
    const getStepMessage = () => {
      if (currentStep === "v3_synthesis") {
        return "Synthesizing final report...";
      } else if (currentStep === "v2_rethink") {
        return `Cross-checking results (${providerCounts.v2} of ${providerCounts.total} providers completed)...`;
      } else if (currentStep === "v1_initial") {
        return `Running initial analysis (${providerCounts.v1} of ${providerCounts.total} providers completed)...`;
      }
      return "Initializing analysis...";
    };

    const getStepNumber = () => {
      if (currentStep === "v3_synthesis") return providerCounts.v2 > 0 ? "3" : "2";
      if (currentStep === "v2_rethink") return "2";
      return "1";
    };

    const totalStepCount = providerCounts.v2 > 0 ? "3" : "2";

    const analysisTypes = [
      {
        icon: Eye,
        label: "Observations",
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        icon: Palette,
        label: "Design",
        color: "text-secondary",
        bgColor: "bg-secondary/10",
      },
      {
        icon: Lightbulb,
        label: "Accessibility",
        color: "text-accent",
        bgColor: "bg-accent/10",
      },
    ];

    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
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
                    className="text-muted/20"
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
                    className="text-primary transition-all duration-500 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {progress}%
                    </div>
                    <div className="text-xs text-muted mt-1">
                      Step {getStepNumber()}/{totalStepCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status message */}
            <div className="space-y-3">
              <h2 className="text-2xl font-bold">Analyzing Your Designs</h2>
              <div className="flex items-center justify-center gap-2 text-muted">
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
                          ? `${item.bgColor} ring-2 ring-primary/50 shadow-lg shadow-primary/20`
                          : "bg-surface-light"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${item.color} ${isActive ? "animate-pulse" : ""}`}
                      />
                    </div>
                    <span
                      className={`text-xs transition-colors duration-500 ${
                        isActive ? "text-foreground" : "text-muted"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="max-w-md mx-auto space-y-2">
              <div className="h-2 bg-muted/20 rounded-full overflow-hidden relative">
                {/* Actual progress */}
                <div
                  className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
                {/* Shimmer */}
                {progress < 100 && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>Step {getStepNumber()} of {totalStepCount}</span>
                <span>{progress}% Complete</span>
              </div>
            </div>

            {/* Info */}
            <div className="text-sm text-muted space-y-1">
              <p>Running multi-provider UX analysis</p>
              <p className="font-mono text-muted/60">
                ID: {analysisId.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>

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

  // Once analysis is complete (or was already complete), render server-side results
  return <>{children}</>;
}
