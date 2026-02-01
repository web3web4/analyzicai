"use client";

import { useState } from "react";

interface ImageGalleryViewerProps {
  imageUrls: string[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
}

export function ImageGalleryViewer({
  imageUrls,
  selectedIndex,
  onSelectIndex,
}: ImageGalleryViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(new Set());

  const handleImageError = (index: number) => {
    setImageLoadErrors((prev) => new Set(prev).add(index));
  };

  const handlePrevious = () => {
    onSelectIndex(selectedIndex > 0 ? selectedIndex - 1 : imageUrls.length - 1);
  };

  const handleNext = () => {
    onSelectIndex(selectedIndex < imageUrls.length - 1 ? selectedIndex + 1 : 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrevious();
    } else if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "Escape") {
      setIsFullscreen(false);
    }
  };

  // Filter out empty URLs and check if we have valid images
  const validImageUrls = imageUrls.filter(url => url && url.trim() !== "");
  
  if (validImageUrls.length === 0) {
    return (
      <div className="aspect-video bg-surface-light rounded-lg flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-2">🖼️</span>
          <p className="text-muted">No images available</p>
          <p className="text-xs text-muted mt-2">
            {imageUrls.length > 0 
              ? "Failed to load image URLs from storage"
              : "No image paths in analysis record"}
          </p>
        </div>
      </div>
    );
  }

  const currentImageUrl = imageUrls[selectedIndex];
  const isEmptyUrl = !currentImageUrl || currentImageUrl.trim() === "";

  return (
    <div 
      className="space-y-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Main image display */}
      <div className="relative aspect-video bg-surface-light rounded-lg overflow-hidden group">
        {imageLoadErrors.has(selectedIndex) || isEmptyUrl ? (
          <div className="w-full h-full flex items-center justify-center text-muted">
            <div className="text-center">
              <span className="text-4xl block mb-2">🖼️</span>
              <p>Image {selectedIndex + 1} unavailable</p>
              {isEmptyUrl && (
                <p className="text-xs mt-2">Failed to load URL</p>
              )}
            </div>
          </div>
        ) : (
          <img
            src={currentImageUrl}
            alt={`Screenshot ${selectedIndex + 1}`}
            className="w-full h-full object-contain cursor-pointer"
            onClick={() => setIsFullscreen(true)}
            onError={() => handleImageError(selectedIndex)}
          />
        )}

        {/* Navigation arrows (visible on hover) */}
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Previous image"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="Next image"
            >
              →
            </button>
          </>
        )}

        {/* Image counter badge */}
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-sm font-medium">
          {selectedIndex + 1} / {imageUrls.length}
        </div>

        {/* Fullscreen button */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          aria-label="View fullscreen"
        >
          ⛶
        </button>
      </div>

      {/* Thumbnail navigation */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {imageUrls.map((url, idx) => (
            <button
              key={idx}
              onClick={() => onSelectIndex(idx)}
              className={`relative flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedIndex
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {imageLoadErrors.has(idx) ? (
                <div className="w-full h-full bg-surface-light flex items-center justify-center text-muted text-xs">
                  ?
                </div>
              ) : (
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(idx)}
                />
              )}
              {/* Thumbnail index */}
              <span className="absolute bottom-0.5 right-0.5 text-[10px] font-medium text-white bg-black/60 px-1 rounded">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setIsFullscreen(false)}
            aria-label="Close fullscreen"
          >
            ✕
          </button>

          {/* Navigation in fullscreen */}
          {imageUrls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Next image"
              >
                →
              </button>
            </>
          )}

          {/* Image counter */}
          <div className="absolute top-4 left-4 px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
            Image {selectedIndex + 1} of {imageUrls.length}
          </div>

          {/* Fullscreen image */}
          <img
            src={imageUrls[selectedIndex]}
            alt={`Screenshot ${selectedIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Thumbnail strip at bottom */}
          {imageUrls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
              {imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectIndex(idx);
                  }}
                  className={`flex-shrink-0 w-16 h-10 rounded overflow-hidden border-2 transition-all ${
                    idx === selectedIndex
                      ? "border-white"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
