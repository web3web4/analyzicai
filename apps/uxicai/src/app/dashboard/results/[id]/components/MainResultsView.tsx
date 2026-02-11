"use client";

import { useState } from "react";
import type { SynthesizedResult } from "@web3web4/ai-core";
import { CategorySection } from "./CategorySection";
import { RecommendationsSection } from "./RecommendationsSection";
import { sortRecommendationsBySeverity } from "../lib/utils";
import { Badge } from "./Badge";

interface MainResultsViewProps {
  finalResult: SynthesizedResult;
  imageUrls?: string[];
  imageCount?: number;
}

export function MainResultsView({ 
  finalResult, 
  imageUrls = [], 
  imageCount = 1 
}: MainResultsViewProps) {
  const [showImage, setShowImage] = useState(false);
  
  // Get top 5 recommendations by severity
  const topRecommendations = sortRecommendationsBySeverity(
    finalResult.recommendations
  ).slice(0, 5);

  const hasMultipleImages = imageCount > 1;

  return (
    <div className="space-y-8">
      {/* Multi-image info banner */}
      {hasMultipleImages && (
        <div className="bg-primary/10 border border-primary/20 px-6 py-4 rounded-xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🖼️</span>
            <div>
              <p className="font-medium">
                Combined Analysis of {imageCount} Images
              </p>
              <p className="text-sm text-muted">
                This is the overall analysis across all images. Switch to the &quot;Per Image&quot; tab to see individual results.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Single image preview (collapsible) */}
      {!hasMultipleImages && imageUrls.length > 0 && imageUrls[0] && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowImage(!showImage)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-light/50 transition-colors"
          >
            <span className="font-medium">Analyzed Screenshot</span>
            <span className="text-muted">{showImage ? "Hide" : "Show"}</span>
          </button>
          {showImage && (
            <div className="px-6 pb-6">
              <img
                src={imageUrls[0]}
                alt="Analyzed screenshot"
                className="w-full max-h-96 object-contain rounded-lg bg-surface-light"
                onError={(e) => {
                  console.error("[MainResultsView] Failed to load image:", imageUrls[0]);
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
          )}
        </div>
      )}

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
