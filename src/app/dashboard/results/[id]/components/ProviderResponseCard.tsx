import type {
  AnalysisResponseRecord,
  AnalysisResult,
} from "@/lib/ai/types";
import { CategoryCard } from "./CategoryCard";
import { RecommendationCard } from "./RecommendationCard";
import { formatDuration } from "../lib/utils";

interface ProviderResponseCardProps {
  response: AnalysisResponseRecord;
}

export function ProviderResponseCard({ response }: ProviderResponseCardProps) {
  const result = response.result as AnalysisResult;

  return (
    <div className="p-6 rounded-xl bg-surface-light border border-border">
      {/* Provider Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div>
          <h4 className="font-semibold text-lg capitalize">
            {response.provider}
          </h4>
          <p className="text-sm text-muted">
            {new Date(response.created_at).toLocaleString()}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{result.overallScore}</div>
          <div className="text-sm text-muted">Overall Score</div>
        </div>
      </div>

      {/* Summary */}
      {result.summary && (
        <div className="mb-6">
          <h5 className="font-medium mb-2">Summary</h5>
          <p className="text-muted">{result.summary}</p>
        </div>
      )}

      {/* Category Scores */}
      {result.categories && (
        <div className="mb-6">
          <h5 className="font-medium mb-3">Category Scores</h5>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(result.categories).map(([key, category]) => (
              <CategoryCard key={key} categoryKey={key} category={category} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <div>
          <h5 className="font-medium mb-3">
            Recommendations ({result.recommendations.length})
          </h5>
          <div className="space-y-4">
            {result.recommendations.map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-4 pt-4 border-t border-border flex items-center gap-4 text-xs text-muted">
        {response.tokens_used && (
          <span>Tokens: {response.tokens_used.toLocaleString()}</span>
        )}
        {response.latency_ms && (
          <span>Latency: {formatDuration(response.latency_ms)}</span>
        )}
      </div>
    </div>
  );
}
