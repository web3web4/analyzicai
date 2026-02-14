import { useState, useCallback } from "react";

export interface UseImageNavigationOptions {
  imageCount: number;
  initialIndex?: number;
  onSelectIndex?: (index: number) => void;
}

export function useImageNavigation({
  imageCount,
  initialIndex = 0,
  onSelectIndex,
}: UseImageNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<number>>(
    new Set(),
  );

  const handleImageError = useCallback((index: number) => {
    setImageLoadErrors((prev) => new Set(prev).add(index));
  }, []);

  const handlePrevious = useCallback(() => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : imageCount - 1;
    setSelectedIndex(newIndex);
    onSelectIndex?.(newIndex);
  }, [selectedIndex, imageCount, onSelectIndex]);

  const handleNext = useCallback(() => {
    const newIndex = selectedIndex < imageCount - 1 ? selectedIndex + 1 : 0;
    setSelectedIndex(newIndex);
    onSelectIndex?.(newIndex);
  }, [selectedIndex, imageCount, onSelectIndex]);

  const selectIndex = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      onSelectIndex?.(index);
    },
    [onSelectIndex],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isFullscreen) return;

      if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    },
    [isFullscreen, handlePrevious, handleNext],
  );

  return {
    selectedIndex,
    isFullscreen,
    setIsFullscreen,
    imageLoadErrors,
    handleImageError,
    handlePrevious,
    handleNext,
    handleKeyDown,
    selectIndex,
  };
}
