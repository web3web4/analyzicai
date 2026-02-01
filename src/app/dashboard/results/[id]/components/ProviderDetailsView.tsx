import type {
  AnalysisResponseRecord,
  AnalysisResult,
} from "@/lib/ai/types";
import { ProviderResponseCard } from "./ProviderResponseCard";

interface ProviderDetailsViewProps {
  v1Responses: AnalysisResponseRecord[];
  v2Responses: AnalysisResponseRecord[];
}

export function ProviderDetailsView({
  v1Responses,
  v2Responses,
}: ProviderDetailsViewProps) {
  // Provider comparison data
  const comparisonData = v1Responses.map((response) => {
    const result = response.result as AnalysisResult;
    return {
      provider: response.provider,
      score: result.overallScore,
      recommendations: result.recommendations.length,
      tokens: response.tokens_used,
      latency: response.latency_ms,
    };
  });

  return (
    <div className="space-y-8">
      {/* Provider Comparison */}
      {comparisonData.length > 0 && (
        <div className="glass-card rounded-2xl p-8">
          <h3 className="text-lg font-semibold mb-6">Provider Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted">
                    Provider
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted">
                    Score
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted">
                    Recommendations
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted">
                    Tokens
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted">
                    Latency
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((data) => (
                  <tr
                    key={data.provider}
                    className="border-b border-border/50"
                  >
                    <td className="py-3 px-4 font-medium capitalize">
                      {data.provider}
                    </td>
                    <td className="py-3 px-4 text-center text-xl font-bold">
                      {data.score}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {data.recommendations}
                    </td>
                    <td className="py-3 px-4 text-center text-muted">
                      {data.tokens.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center text-muted">
                      {data.latency ? `${(data.latency / 1000).toFixed(2)}s` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 1: Initial Analysis */}
      {v1Responses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-muted">
            Step 1: Initial Analysis
          </h3>
          <div className="space-y-6">
            {v1Responses.map((response) => (
              <ProviderResponseCard key={response.id} response={response} />
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Rethink Analysis */}
      {v2Responses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-muted">
            Step 2: Rethink Analysis
          </h3>
          <div className="space-y-6">
            {v2Responses.map((response) => (
              <ProviderResponseCard key={response.id} response={response} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {v1Responses.length === 0 && v2Responses.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted">No provider responses available yet</p>
        </div>
      )}
    </div>
  );
}
