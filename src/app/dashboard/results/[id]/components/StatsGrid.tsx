import type { Recommendation } from "@/lib/ai/types";
import { countBySeverity, calculateConsensusScore, formatDuration } from "../lib/utils";

interface StatsGridProps {
  recommendations: Recommendation[];
  providerAgreement?: Array<{
    category: string;
    agreement: "high" | "medium" | "low";
  }>;
  totalLatency?: number;
}

export function StatsGrid({
  recommendations,
  providerAgreement,
  totalLatency,
}: StatsGridProps) {
  const severityCounts = countBySeverity(recommendations);
  const criticalCount = severityCounts.critical || 0;
  const highCount = severityCounts.high || 0;
  const consensusScore = providerAgreement
    ? calculateConsensusScore(providerAgreement)
    : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Critical Issues */}
      <div className="p-4 rounded-xl bg-surface-light border border-border">
        <div className="text-2xl font-bold text-error">
          {criticalCount + highCount}
        </div>
        <div className="text-sm text-muted mt-1">Critical + High Issues</div>
      </div>

      {/* Total Recommendations */}
      <div className="p-4 rounded-xl bg-surface-light border border-border">
        <div className="text-2xl font-bold">{recommendations.length}</div>
        <div className="text-sm text-muted mt-1">Total Recommendations</div>
      </div>

      {/* Provider Consensus */}
      {consensusScore !== null && (
        <div className="p-4 rounded-xl bg-surface-light border border-border">
          <div className="text-2xl font-bold text-success">{consensusScore}%</div>
          <div className="text-sm text-muted mt-1">Provider Consensus</div>
        </div>
      )}

      {/* Analysis Time */}
      {totalLatency && (
        <div className="p-4 rounded-xl bg-surface-light border border-border">
          <div className="text-2xl font-bold">{formatDuration(totalLatency)}</div>
          <div className="text-sm text-muted mt-1">Analysis Time</div>
        </div>
      )}
    </div>
  );
}
