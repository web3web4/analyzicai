"use client";

import { ReactNode } from "react";

interface StickyImageViewerProps {
  imageUrl?: string;
  imageAlt: string;
  onImageClick: () => void;
  onImageError: () => void;
  imageLoadError: boolean;
  children: ReactNode;
}

export function StickyImageViewer({
  imageUrl,
  imageAlt,
  onImageClick,
  onImageError,
  imageLoadError,
  children,
}: StickyImageViewerProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Left column: Image (sticky on wide screens) */}
      {imageUrl && !imageLoadError && (
        <div className="lg:sticky lg:top-6 h-fit">
          <div className="rounded-lg overflow-hidden bg-surface border border-border group relative">
            <img
              src={imageUrl}
              alt={imageAlt}
              className="w-full max-h-[70vh] object-contain cursor-pointer"
              onClick={onImageClick}
              onError={onImageError}
            />
            {/* Fullscreen hint */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none">
              <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/60 px-3 py-1.5 rounded-full transition-opacity">
                Click to view fullscreen
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Right column: Content */}
      <div className="space-y-6">{children}</div>
    </div>
  );
}
