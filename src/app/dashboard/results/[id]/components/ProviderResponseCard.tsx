"use client";

import { useState } from "react";
import type {
  AnalysisResponseRecord,
  AnalysisResult,
  PerImageResult,
} from "@/lib/ai-domains/ux-analysis/types";
import { CategoryCard } from "./CategoryCard";
import { RecommendationCard } from "./RecommendationCard";
import { formatDuration, roundScore } from "../lib/utils";

interface ProviderResponseCardProps {
  response: AnalysisResponseRecord;
}

export function ProviderResponseCard({ response }: ProviderResponseCardProps) {
  const result = response.result as AnalysisResult;
  const hasPerImageResults = result.perImageResults && result.perImageResults.length > 0;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"overall" | "per-image">(
    hasPerImageResults ? "per-image" : "overall"
  );

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
          {hasPerImageResults && result.perImageResults && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
              {result.imageCount || result.perImageResults.length} images analyzed
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{roundScore(result.overallScore)}</div>
          <div className="text-sm text-muted">Overall Score</div>
        </div>
      </div>

      {/* View Mode Toggle (for multi-image) */}
      {hasPerImageResults && (
        <div className="mb-4 flex gap-2 bg-surface rounded-lg p-1">
          <button
            onClick={() => setViewMode("per-image")}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
              viewMode === "per-image"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Per-Image Results
          </button>
          <button
            onClick={() => setViewMode("overall")}
            className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
              viewMode === "overall"
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            Overall Results
          </button>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === "per-image" && hasPerImageResults ? (
        <div>
          {/* Image selector */}
          <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
            {result.perImageResults!.map((imgResult: PerImageResult) => (
              <button
                key={imgResult.imageIndex}
                onClick={() => setSelectedImageIndex(imgResult.imageIndex)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedImageIndex === imgResult.imageIndex
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:bg-surface-light"
                }`}
              >
                Image {imgResult.imageIndex + 1}
                <span className="ml-2 text-xs opacity-75">
                  {roundScore(imgResult.overallScore)}
                </span>
              </button>
            ))}
          </div>

          {/* Per-image content */}
          {result.perImageResults!.map((imgResult: PerImageResult) => {
            if (imgResult.imageIndex !== selectedImageIndex) return null;
            
            return (
              <div key={imgResult.imageIndex}>
                {/* Image summary */}
                <div className="mb-6">
                  <h5 className="font-medium mb-2">
                    Image {imgResult.imageIndex + 1} Summary
                  </h5>
                  {imgResult.summary ? (
                    <p className="text-muted">{imgResult.summary}</p>
                  ) : (
                    <p className="text-muted italic">No summary provided for this image</p>
                  )}
                </div>

                {/* Image categories */}
                {imgResult.categories && (
                  <div className="mb-6">
                    <h5 className="font-medium mb-3">Category Scores</h5>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(imgResult.categories).map(([key, category]) => (
                        <CategoryCard key={key} categoryKey={key} category={category} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Image recommendations */}
                {imgResult.recommendations && imgResult.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3">
                      Recommendations ({imgResult.recommendations.length})
                    </h5>
                    <div className="space-y-4">
                      {imgResult.recommendations.map((rec, i) => (
                        <RecommendationCard key={i} recommendation={rec} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Overall view */
        <div>
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
