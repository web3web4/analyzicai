"use client";

import type { SynthesizedResult } from "@/lib/ai/types";
import { CategorySection } from "./CategorySection";
import { RecommendationsSection } from "./RecommendationsSection";
import { sortRecommendationsBySeverity } from "../lib/utils";
import { Badge } from "./Badge";

interface MainResultsViewProps {
  finalResult: SynthesizedResult;
}

export function MainResultsView({ finalResult }: MainResultsViewProps) {
  // Get top 5 recommendations by severity
  const topRecommendations = sortRecommendationsBySeverity(
    finalResult.recommendations
  ).slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Recommendations Preview */}
      {topRecommendations.length > 0 && (
        <div className="glass-card rounded-2xl p-8">
          <h3 className="text-lg font-semibold mb-6">
            Top {topRecommendations.length} Recommendations
          </h3>
          <p className="text-sm text-muted mb-6">
            These are the highest priority items to address. View all
            recommendations and apply filters below.
          </p>
          <div className="space-y-4">
            {topRecommendations.map((rec, i) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-surface-light border border-border"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge severity={rec.severity}>{rec.severity}</Badge>
                  <span className="text-sm text-muted">{rec.category}</span>
                </div>
                <h4 className="font-medium">{rec.title}</h4>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Section */}
      <CategorySection
        categories={finalResult.categories}
        providerAgreement={finalResult.providerAgreement}
      />

      {/* All Recommendations with Filters */}
      {finalResult.recommendations && finalResult.recommendations.length > 0 && (
        <div className="glass-card rounded-2xl p-8">
          <h3 className="text-lg font-semibold mb-6">All Recommendations</h3>
          <RecommendationsSection recommendations={finalResult.recommendations} />
        </div>
      )}
    </div>
  );
}
