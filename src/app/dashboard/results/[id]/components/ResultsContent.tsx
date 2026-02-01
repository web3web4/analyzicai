"use client";

import { useState } from "react";
import type {
  SynthesizedResult,
  AnalysisResponseRecord,
} from "@/lib/ai/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
import { MainResultsView } from "./MainResultsView";
import { ProviderDetailsView } from "./ProviderDetailsView";
import { ImageGalleryViewer } from "./ImageGalleryViewer";
import { PerImageResultsView } from "./PerImageResultsView";

interface ResultsContentProps {
  finalResult: SynthesizedResult;
  v1Responses: AnalysisResponseRecord[];
  v2Responses: AnalysisResponseRecord[];
  imageUrls: string[];
  imageCount: number;
}

export function ResultsContent({
  finalResult,
  v1Responses,
  v2Responses,
  imageUrls,
  imageCount,
}: ResultsContentProps) {
  const totalResponses = v1Responses.length + v2Responses.length;
  const hasMultipleImages = imageCount > 1;
  const hasPerImageResults = finalResult.perImageResults && finalResult.perImageResults.length > 0;
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  return (
    <Tabs defaultValue="results">
      <TabsList>
        <TabsTrigger value="results">
          Overall Results
        </TabsTrigger>
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
        <MainResultsView 
          finalResult={finalResult} 
          imageUrls={imageUrls}
          imageCount={imageCount}
        />
      </TabsContent>

      {hasMultipleImages && (
        <TabsContent value="per-image">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Analyzed Images</h3>
              <ImageGalleryViewer
                imageUrls={imageUrls}
                selectedIndex={selectedImageIndex}
                onSelectIndex={setSelectedImageIndex}
              />
            </div>

            {/* Per-Image Results */}
            <div className="space-y-4">
              {hasPerImageResults ? (
                <PerImageResultsView
                  perImageResults={finalResult.perImageResults!}
                  selectedImageIndex={selectedImageIndex}
                />
              ) : (
                <div className="text-center py-12 bg-surface-light rounded-lg">
                  <p className="text-muted">
                    Per-image analysis not available for this result.
                  </p>
                  <p className="text-sm text-muted mt-2">
                    The overall analysis above covers all {imageCount} images.
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
  );
}
