"use client";

import { useState } from "react";
import type { SynthesizedResult, AnalysisResponseRecord } from "@/lib/ai/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
import { MainResultsView } from "./MainResultsView";
import { ProviderDetailsView } from "./ProviderDetailsView";
import { ImageGalleryViewer } from "./ImageGalleryViewer";
import { PerImageResultsView } from "./PerImageResultsView";
import { RetryPanel } from "./RetryPanel";

interface ResultsContentProps {
  finalResult: SynthesizedResult | undefined;
  v1Responses: AnalysisResponseRecord[];
  v2Responses: AnalysisResponseRecord[];
  imageUrls: string[];
  imageCount: number;
  analysisId: string;
  failedProviders: string[];
  synthesisFailed: boolean;
  hasPartialResults: boolean;
  allProviders: string[];
  masterProvider: string;
}

export function ResultsContent({
  finalResult,
  v1Responses,
  v2Responses,
  imageUrls,
  imageCount,
  analysisId,
  failedProviders,
  synthesisFailed,
  hasPartialResults,
  allProviders,
  masterProvider,
}: ResultsContentProps) {
  const totalResponses = v1Responses.length + v2Responses.length;
  const hasMultipleImages = imageCount > 1;
  const hasPerImageResults =
    finalResult?.perImageResults && finalResult.perImageResults.length > 0;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Debug logging for image URLs
  console.log("[ResultsContent] Image URLs:", {
    count: imageUrls.length,
    urls: imageUrls,
    hasValidUrls: imageUrls.filter(url => url && url.trim() !== "").length,
  });

  return (
    <div className="space-y-6">
      {/* Debug: Show image data info */}
      {imageUrls.length > 0 && (
        <div className="text-xs text-muted bg-surface-light p-3 rounded-lg">
          <strong>Debug:</strong> {imageUrls.filter(url => url).length}/{imageUrls.length} image URLs loaded
          {imageUrls.some(url => !url) && " (Some URLs failed to load)"}
        </div>
      )}
      
      {/* Retry Panel - Show if there are failures */}
      {hasPartialResults && (
        <RetryPanel
          analysisId={analysisId}
          failedProviders={failedProviders}
          synthesisFailed={synthesisFailed}
          allProviders={allProviders}
          masterProvider={masterProvider}
        />
      )}

      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results">Overall Results</TabsTrigger>
          {hasMultipleImages && (
            <TabsTrigger value="per-image">
              Per Image ({imageCount})
            </TabsTrigger>
          )}
          <TabsTrigger value="providers">
            Provider Details ({totalResponses})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          {finalResult ? (
            <MainResultsView
              finalResult={finalResult}
              imageUrls={imageUrls}
              imageCount={imageCount}
            />
          ) : (
            /* Show partial results from v1 if no synthesis */
            <div className="glass-card rounded-2xl p-8">
              <div className="mb-6 pb-6 border-b border-border">
                <h3 className="text-lg font-semibold mb-2">
                  Partial Results Available
                </h3>
                <p className="text-muted text-sm">
                  Showing individual provider analyses. Synthesis step did not
                  complete.
                </p>
              </div>
              <ProviderDetailsView
                v1Responses={v1Responses}
                v2Responses={v2Responses}
              />
            </div>
          )}
        </TabsContent>

        {hasMultipleImages && (
          <TabsContent value="per-image">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Image Gallery */}
              {hasPerImageResults && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Analyzed Images</h3>
                  <ImageGalleryViewer
                    imageUrls={imageUrls}
                    selectedIndex={selectedImageIndex}
                    onSelectIndex={setSelectedImageIndex}
                  />
                </div>
              )}

              {/* Per-Image Results */}
              <div className="space-y-4">
                {hasPerImageResults ? (
                  <PerImageResultsView
                    perImageResults={finalResult!.perImageResults!}
                    selectedImageIndex={selectedImageIndex}
                  />
                ) : (
                  <div className="text-center py-12 bg-surface-light rounded-lg">
                    <p className="text-muted">
                      Per-image analysis not available for this result.
                    </p>
                    <p className="text-sm text-muted mt-2">
                      {finalResult
                        ? `The overall analysis above covers all ${imageCount} images.`
                        : "Synthesis step did not complete. Try the retry option above."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        )}

        <TabsContent value="providers">
          <ProviderDetailsView
            v1Responses={v1Responses}
            v2Responses={v2Responses}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
