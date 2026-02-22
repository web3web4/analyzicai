"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface AnalysisStatusResponse {
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

export type AnalysisStep =
  | "initializing"
  | "v1_initial"
  | "v2_rethink"
  | "v3_synthesis";

export interface UseAnalysisProgressReturn {
  status: string;
  progress: number;
  currentStep: AnalysisStep;
  providerCounts: { v1: number; v2: number; synthesis: boolean; total: number };
  isPolling: boolean;
  rotationIndex: number;
}

/**
 * Polls `/api/analysis-status/:id` and tracks live progress through the
 * three-step AI pipeline (v1 initial → v2 rethink → v3 synthesis).
 *
 * When the analysis reaches a terminal state (`completed`, `partial`, `failed`)
 * polling stops and the page is refreshed so the server component re-renders
 * with final data.
 */
export function useAnalysisProgress(
  analysisId: string,
  initialStatus: string,
): UseAnalysisProgressReturn {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<AnalysisStep>("initializing");
  const [providerCounts, setProviderCounts] = useState({
    v1: 0,
    v2: 0,
    synthesis: false,
    total: 0,
  });
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isPolling, setIsPolling] = useState(
    initialStatus === "pending" || initialStatus === "processing",
  );

  // Rotate the active icon indicator every 2 s while polling
  useEffect(() => {
    if (!isPolling) return;
    const timer = setInterval(() => {
      setRotationIndex((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(timer);
  }, [isPolling]);

  // Poll every 2 s for status updates; also fire immediately on mount
  useEffect(() => {
    if (!isPolling) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/analysis-status/${analysisId}`);
        if (!res.ok) {
          console.error(
            "[useAnalysisProgress] Failed to fetch status",
            res.status,
          );
          return;
        }

        const data: AnalysisStatusResponse = await res.json();

        setStatus(data.analysis.status);
        setProgress(data.progress);

        const total = (data.analysis.providers_used ?? []).length;
        const v1 = data.responses.v1Count;
        const v2 = data.responses.v2Count;
        const synthesis = data.responses.hasSynthesis;

        setProviderCounts({ v1, v2, synthesis, total });

        // Derive the current step.
        // Synthesis is stored only when complete, so we infer it is *running*
        // once all v1 (and v2 when active) responses have been received.
        if (synthesis) {
          setCurrentStep("v3_synthesis");
        } else if (v2 > 0) {
          setCurrentStep("v2_rethink");
        } else if (total > 0 && v1 >= total) {
          // All v1 done, synthesis must be starting
          setCurrentStep("v3_synthesis");
        } else if (v1 > 0) {
          setCurrentStep("v1_initial");
        }

        const isTerminal =
          data.analysis.status === "completed" ||
          data.analysis.status === "partial" ||
          data.analysis.status === "failed";

        if (isTerminal) {
          setIsPolling(false);
          router.refresh();
        }
      } catch (err) {
        console.error("[useAnalysisProgress] Poll error:", err);
      }
    };

    // Fire once immediately, then on each interval tick
    fetchStatus();
    const poll = setInterval(fetchStatus, 2000);

    return () => clearInterval(poll);
  }, [analysisId, isPolling, router]);

  return {
    status,
    progress,
    currentStep,
    providerCounts,
    isPolling,
    rotationIndex,
  };
}
