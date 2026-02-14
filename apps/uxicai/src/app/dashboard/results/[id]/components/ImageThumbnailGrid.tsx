"use client";

import { roundScore } from "../lib/utils";

interface ImageThumbnailGridProps {
  imageUrls: string[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  imageLoadErrors: Set<number>;
  onImageError: (index: number) => void;
  scores?: number[];
  showScores?: boolean;
}

export function ImageThumbnailGrid({
  imageUrls,
  selectedIndex,
  onSelectIndex,
  imageLoadErrors,
  onImageError,
  scores = [],
  showScores = false,
}: ImageThumbnailGridProps) {
  if (imageUrls.length <= 1) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {imageUrls.map((url, idx) => (
        <button
          key={idx}
          onClick={() => onSelectIndex(idx)}
          className={`relative flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
            selectedIndex === idx
              ? "border-primary ring-2 ring-primary/20"
              : "border-border hover:border-primary/50"
          }`}
        >
          {imageLoadErrors.has(idx) || !url ? (
            <div className="w-full h-full bg-surface-light flex items-center justify-center text-muted text-xs">
              ?
            </div>
          ) : (
            <img
              src={url}
              alt={`Thumbnail ${idx + 1}`}
              className="w-full h-full object-cover"
              onError={() => onImageError(idx)}
            />
          )}
          <span className="absolute bottom-0.5 right-0.5 text-[10px] font-medium text-white bg-black/60 px-1 rounded">
            {idx + 1}
          </span>
          {showScores && scores[idx] !== undefined && (
            <span className="absolute top-0.5 left-0.5 text-[10px] font-medium text-white bg-black/60 px-1 rounded">
              {roundScore(scores[idx])}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
