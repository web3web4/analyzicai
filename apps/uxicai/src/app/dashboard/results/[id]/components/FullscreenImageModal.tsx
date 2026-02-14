"use client";

interface FullscreenImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageIndex: number;
  totalImages: number;
  imageUrls?: string[];
  onPrevious?: () => void;
  onNext?: () => void;
  onSelectIndex?: (index: number) => void;
  imageLoadErrors?: Set<number>;
  onImageError?: (index: number) => void;
  label?: string;
}

export function FullscreenImageModal({
  isOpen,
  onClose,
  imageUrl,
  imageIndex,
  totalImages,
  imageUrls = [],
  onPrevious,
  onNext,
  onSelectIndex,
  imageLoadErrors = new Set(),
  onImageError,
  label,
}: FullscreenImageModalProps) {
  if (!isOpen) return null;

  const hasMultipleImages = totalImages > 1;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
        onClick={onClose}
        aria-label="Close fullscreen"
      >
        ✕
      </button>

      {/* Navigation arrows */}
      {hasMultipleImages && onPrevious && onNext && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            aria-label="Previous image"
          >
            ←
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            aria-label="Next image"
          >
            →
          </button>
        </>
      )}

      {/* Image counter and optional label */}
      <div className="absolute top-4 left-4 space-y-2 z-10">
        <div className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
          Image {imageIndex + 1} of {totalImages}
        </div>
        {label && (
          <div className="px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium">
            {label}
          </div>
        )}
      </div>

      {/* Main image */}
      <img
        src={imageUrl}
        alt={`Screenshot ${imageIndex + 1}`}
        className="max-w-[90vw] max-h-[90vh] object-contain"
        onClick={(e) => e.stopPropagation()}
        onError={() => onImageError?.(imageIndex)}
      />

      {/* Thumbnail strip */}
      {hasMultipleImages && imageUrls.length > 0 && onSelectIndex && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 py-2 bg-black/50 rounded-lg max-w-[90vw] overflow-x-auto">
          {imageUrls.map((url, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                onSelectIndex(idx);
              }}
              className={`flex-shrink-0 w-16 h-10 rounded overflow-hidden border-2 transition-all ${
                idx === imageIndex
                  ? "border-white"
                  : "border-transparent opacity-60 hover:opacity-100"
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
                  onError={() => onImageError?.(idx)}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
