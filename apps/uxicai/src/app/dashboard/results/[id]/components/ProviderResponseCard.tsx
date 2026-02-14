"use client";

import { useState, useEffect } from "react";
import type {
  AnalysisResponseRecord,
  AnalysisResult,
  PerImageResult,
} from "@web3web4/ai-core";
import { CategoryCard } from "./CategoryCard";
import { RecommendationCard } from "./RecommendationCard";
import { ImageThumbnailGrid } from "./ImageThumbnailGrid";
import { StickyImageViewer } from "./StickyImageViewer";
import { FullscreenImageModal } from "./FullscreenImageModal";
import { useImageNavigation } from "../hooks/useImageNavigation";
import { formatDuration, roundScore } from "../lib/utils";

interface ProviderResponseCardProps {
  response: AnalysisResponseRecord;
  imageUrls?: string[];
}

export function ProviderResponseCard({ response, imageUrls = [] }: ProviderResponseCardProps) {
  const result = response.result as AnalysisResult;
  const hasPerImageResults = result.perImageResults && result.perImageResults.length > 0;
  const [viewMode, setViewMode] = useState<"overall" | "per-image">(
    hasPerImageResults ? "per-image" : "overall"
  );

  const navigation = useImageNavigation({
    imageCount: imageUrls.length,
    initialIndex: 0,
  });

  // Reset selection when switching view modes
  useEffect(() => {
    if (viewMode === "per-image") {
      navigation.selectIndex(0);
    }
  }, [viewMode]);

  // Debug logging
  if (process.env.NODE_ENV !== "production") {
    console.log(`[ProviderResponseCard] ${response.provider} rendering:`, {
      viewMode,
      hasResult: !!result,
      hasSummary: !!result.summary,
      hasCategories: !!result.categories,
      categoriesKeys: result.categories ? Object.keys(result.categories) : [],
      hasRecommendations: !!result.recommendations,
      recommendationsLength: result.recommendations?.length,
      hasPerImageResults,
    });
  }

  return (
    <div 
      className="p-6 rounded-xl bg-surface-light border border-border"
      onKeyDown={navigation.handleKeyDown}
      tabIndex={0}
    >
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
          {/* Thumbnail strip for image selection */}
          {imageUrls.length > 0 && (
            <div className="mb-4">
              <ImageThumbnailGrid
                imageUrls={imageUrls}
                selectedIndex={navigation.selectedIndex}
                onSelectIndex={navigation.selectIndex}
                imageLoadErrors={navigation.imageLoadErrors}
                onImageError={navigation.handleImageError}
                scores={result.perImageResults!.map((r: PerImageResult) => r.overallScore)}
                showScores={true}
              />
            </div>
          )}

          {/* Image selector buttons (fallback if no images) */}
          {imageUrls.length === 0 && (
            <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2">
              {result.perImageResults!.map((imgResult: PerImageResult) => (
                <button
                  key={imgResult.imageIndex}
                  onClick={() => navigation.selectIndex(imgResult.imageIndex)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    navigation.selectedIndex === imgResult.imageIndex
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
          )}

          {/* Per-image content */}
          {result.perImageResults!.map((imgResult: PerImageResult) => {
            if (imgResult.imageIndex !== navigation.selectedIndex) return null;
            
            const imageUrl = imageUrls[imgResult.imageIndex];
            
            return (
              <StickyImageViewer
                key={imgResult.imageIndex}
                imageUrl={imageUrl}
                imageAlt={`Screenshot ${imgResult.imageIndex + 1}`}
                onImageClick={() => navigation.setIsFullscreen(true)}
                onImageError={() => navigation.handleImageError(imgResult.imageIndex)}
                imageLoadError={navigation.imageLoadErrors.has(imgResult.imageIndex)}
              >
                  {/* Image summary */}
                  <div>
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
                    <div>
                      <h5 className="font-medium mb-3">Category Scores</h5>
                      <div className="grid gap-4">
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
                </StickyImageViewer>
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

      {/* Fullscreen modal */}
      <FullscreenImageModal
        isOpen={!!(navigation.isFullscreen && hasPerImageResults && imageUrls.length > 0)}
        onClose={() => navigation.setIsFullscreen(false)}
        imageUrl={imageUrls[navigation.selectedIndex] || ""}
        imageIndex={navigation.selectedIndex}
        totalImages={imageUrls.length}
        imageUrls={imageUrls}
        onPrevious={navigation.handlePrevious}
        onNext={navigation.handleNext}
        onSelectIndex={navigation.selectIndex}
        imageLoadErrors={navigation.imageLoadErrors}
        onImageError={navigation.handleImageError}
        label={response.provider}
      />
    </div>
  );
}
