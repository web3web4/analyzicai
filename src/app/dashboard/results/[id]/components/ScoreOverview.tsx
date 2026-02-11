import type { SynthesizedResult, AnalysisResponseRecord } from "@/lib/ai-domains/ux-analysis/types";
import { ScoreCircle } from "./ScoreCircle";
import { StatsGrid } from "./StatsGrid";

interface ScoreOverviewProps {
  score?: number;
  createdAt: string;
  providers: string[];
  finalResult?: SynthesizedResult;
  responses: AnalysisResponseRecord[];
  imageCount?: number;
}

export function ScoreOverview({
  score,
  createdAt,
  providers,
  finalResult,
  responses,
  imageCount = 1,
}: ScoreOverviewProps) {
  // Calculate total latency
  const totalLatency = responses.reduce(
    (sum, r) => sum + (r.latency_ms || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Main Score Display */}
      <div className="glass-card rounded-2xl p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreCircle score={score} />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold mb-2">Analysis Results</h1>
            <p className="text-muted mb-4">
              {imageCount > 1 && (
                <span className="inline-flex items-center gap-1.5 mr-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {imageCount} images
                </span>
              )}
              Analyzed on {new Date(createdAt).toLocaleDateString()} using{" "}
              {providers.join(", ")}
            </p>
            {finalResult?.summary && (
              <p className="text-muted">{finalResult.summary}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {finalResult && (
        <StatsGrid
          recommendations={finalResult.recommendations}
          providerAgreement={finalResult.providerAgreement}
          totalLatency={totalLatency > 0 ? totalLatency : undefined}
        />
      )}
    </div>
  );
}
