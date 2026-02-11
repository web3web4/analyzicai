"use client";

import type { PerImageResult, CategoryScore } from "@/lib/ai-domains/ux-analysis/types";
import { ScoreCircle } from "./ScoreCircle";
import { CategoryCard } from "./CategoryCard";
import { RecommendationCard } from "./RecommendationCard";
import { sortRecommendationsBySeverity, roundScore } from "../lib/utils";

interface PerImageResultsViewProps {
  perImageResults: PerImageResult[];
  selectedImageIndex: number;
}

type CategoryKey = keyof PerImageResult["categories"];

const CATEGORY_KEYS: CategoryKey[] = [
  "colorContrast",
  "typography",
  "layoutComposition",
  "navigation",
  "accessibility",
  "visualHierarchy",
  "whitespace",
  "consistency",
];

export function PerImageResultsView({
  perImageResults,
  selectedImageIndex,
}: PerImageResultsViewProps) {
  // Handle case when no per-image results are available
  if (!perImageResults || perImageResults.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">No per-image analysis available</p>
        <p className="text-sm text-muted mt-2">
          This analysis may have been run before multi-image support was enabled.
        </p>
      </div>
    );
  }

  // Find the result for the selected image
  const result = perImageResults.find((r) => r.imageIndex === selectedImageIndex);

  // If no result found for this index, show a message
  if (!result) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">
          No analysis data available for Image {selectedImageIndex + 1}
        </p>
      </div>
    );
  }

  const sortedRecommendations = sortRecommendationsBySeverity(result.recommendations);

  return (
    <div className="space-y-6">
      {/* Header with score */}
      <div className="flex items-center gap-6 pb-4 border-b border-border">
        <ScoreCircle score={result.overallScore} />
        <div>
          <h3 className="text-xl font-semibold mb-2">
            Image {selectedImageIndex + 1} Analysis
          </h3>
          {result.summary && (
            <p className="text-muted">{result.summary}</p>
          )}
        </div>
      </div>

      {/* Categories grid */}
      <div>
        <h4 className="font-semibold mb-4">Category Breakdown</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORY_KEYS.map((categoryKey) => {
            const category = result.categories[categoryKey] as CategoryScore;
            if (!category) return null;
            return (
              <CategoryCard
                key={categoryKey}
                categoryKey={categoryKey}
                category={category}
              />
            );
          })}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="font-semibold mb-4">
          Image-Specific Recommendations ({result.recommendations.length})
        </h4>
        {sortedRecommendations.length > 0 ? (
          <div className="space-y-4">
            {sortedRecommendations.slice(0, 5).map((rec, i) => (
              <RecommendationCard key={i} recommendation={rec} />
            ))}
            {sortedRecommendations.length > 5 && (
              <p className="text-sm text-muted text-center">
                + {sortedRecommendations.length - 5} more recommendations
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted">No specific recommendations for this image</p>
        )}
      </div>
    </div>
  );
}

// Compact version for side-by-side view
export function PerImageResultsCompact({
  result,
  imageIndex,
}: {
  result: PerImageResult;
  imageIndex: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="var(--surface-light)"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="url(#scoreGradientSmall)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${result.overallScore * 1.76} 176`}
            />
            <defs>
              <linearGradient
                id="scoreGradientSmall"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="var(--primary)" />
                <stop offset="100%" stopColor="var(--accent)" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{roundScore(result.overallScore)}</span>
          </div>
        </div>
        <div>
          <h4 className="font-medium">Image {imageIndex + 1}</h4>
          <p className="text-sm text-muted">Score: {roundScore(result.overallScore)}/100</p>
        </div>
      </div>

      {result.summary && (
        <p className="text-sm text-muted line-clamp-2">{result.summary}</p>
      )}

      {result.recommendations.length > 0 && (
        <div className="text-sm">
          <span className="text-muted">
            {result.recommendations.length} recommendation
            {result.recommendations.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
