import type {
  AnalysisResponseRecord,
  AnalysisResult,
} from "@web3web4/ai-core";
import { ProviderResponseCard } from "./ProviderResponseCard";
import { roundScore } from "../lib/utils";

interface ProviderDetailsViewProps {
  v1Responses: AnalysisResponseRecord[];
  v2Responses: AnalysisResponseRecord[];
  imageUrls?: string[];
}

export function ProviderDetailsView({
  v1Responses,
  v2Responses,
  imageUrls = [],
}: ProviderDetailsViewProps) {
  // Provider comparison data
  const comparisonData = v1Responses.map((response) => {
    const result = response.result as AnalysisResult;
    
    // Debug logging
    if (process.env.NODE_ENV !== "production") {
      console.log(`[ProviderDetailsView] ${response.provider} data:`, {
        hasResult: !!result,
        resultKeys: result ? Object.keys(result) : [],
        hasRecommendations: !!result.recommendations,
        recommendationsType: typeof result.recommendations,
        recommendationsIsArray: Array.isArray(result.recommendations),
        recommendationsLength: result.recommendations?.length,
        hasCategories: !!result.categories,
        hasSummary: !!result.summary,
      });
    }
    
    return {
      provider: response.provider,
      score: result.overallScore,
      recommendations: result.recommendations?.length || 0,
      tokens: response.tokens_used,
      latency: response.latency_ms,
      hasPerImageResults: result.perImageResults && result.perImageResults.length > 0,
      imageCount: result.imageCount || 0,
    };
  });

  const hasAnyPerImageResults = comparisonData.some(d => d.hasPerImageResults);

  return (
    <div className="space-y-8">
      {/* Per-image results info banner */}
      {hasAnyPerImageResults && (
        <div className="bg-primary/10 border border-primary/20 px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖼️</span>
            <div>
              <p className="font-medium">
                Per-Image Results Available
              </p>
              <p className="text-sm text-muted">
                Each provider analyzed individual images. Use the &quot;Per-Image Results&quot; / &quot;Overall Results&quot; toggle in each provider card below.
              </p>
            </div>
          </div>
        </div>
      )}
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
                      {roundScore(data.score)}
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
              <ProviderResponseCard key={response.id} response={response} imageUrls={imageUrls} />
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
              <ProviderResponseCard key={response.id} response={response} imageUrls={imageUrls} />
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
