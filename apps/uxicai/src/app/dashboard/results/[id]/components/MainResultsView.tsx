"use client";

import { useState } from "react";
import type { SynthesizedResult } from "@web3web4/ai-core";
import { CategorySection } from "./CategorySection";
import { RecommendationsSection } from "./RecommendationsSection";
import { sortRecommendationsBySeverity } from "../lib/utils";
import { Badge } from "./Badge";
import { ImageGalleryViewer } from "./ImageGalleryViewer";

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImage, setShowImage] = useState(true);
  
  // Get top 5 recommendations by severity
  const topRecommendations = sortRecommendationsBySeverity(
    finalResult.recommendations
  ).slice(0, 5);

  const hasMultipleImages = imageCount > 1;

  return (
    <div className="space-y-8">
      {/* Uploaded Images Section */}
      {imageUrls.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-primary/5 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🖼️</span>
                <div>
                  <h3 className="font-semibold">
                    {hasMultipleImages 
                      ? `Analyzed Images (${imageCount})` 
                      : "Analyzed Screenshot"}
                  </h3>
                  {hasMultipleImages && (
                    <p className="text-sm text-muted">
                      Combined analysis across all images. See &quot;Per Image&quot; tab for individual results.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowImage(!showImage)}
                className="px-3 py-1.5 text-sm rounded-lg hover:bg-surface-light transition-colors"
              >
                {showImage ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          
          {showImage && (
            <div className="p-6">
              {hasMultipleImages ? (
                <ImageGalleryViewer
                  imageUrls={imageUrls}
                  selectedIndex={selectedImageIndex}
                  onSelectIndex={setSelectedImageIndex}
                />
              ) : (
                <img
                  src={imageUrls[0]}
                  alt="Analyzed screenshot"
                  className="w-full max-h-96 object-contain rounded-lg bg-surface-light"
                  onError={(e) => {
                    console.error("[MainResultsView] Failed to load image:", imageUrls[0]);
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
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
