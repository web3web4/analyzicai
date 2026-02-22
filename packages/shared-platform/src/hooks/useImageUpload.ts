"use client";

import { useState, useRef, useCallback } from "react";
import { rasterizeSvg } from "../utils/image";

export interface ImageItem {
  file: File;
  preview: string;
  id: string;
}

/** How the current image set was last populated. */
export type ImageSourceType = "upload" | "screen_capture";

export interface UseImageUploadOptions {
  /** Maximum number of images allowed at once. Default: 10 */
  maxImages?: number;
  /** Maximum bytes per individual file. Default: 10 MB */
  maxFileSizeBytes?: number;
  /** Maximum combined bytes across all files. Default: 50 MB */
  maxTotalSizeBytes?: number;
}

export interface UseImageUploadReturn {
  images: ImageItem[];
  sourceType: ImageSourceType;
  error: string;
  setError: (msg: string) => void;
  /** Validate, rasterize SVGs if needed, and add files to the image list. */
  addImages: (files: File[]) => Promise<void>;
  removeImage: (id: string) => void;
  clearAllImages: () => void;
  /** Capture a screen/window/tab via the browser's screen-share API. */
  captureScreen: () => Promise<void>;
  /** Low-level validation without mutating state — useful if you need to check
   *  files before calling addImages. Note: SVGs are NOT pre-rasterized here. */
  validateFiles: (files: File[]) => { valid: File[]; errors: string[] };
  /** Ref to attach to a hidden `<input type="file">` element. */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Suitable `accept` attribute value for `<input type="file">`. */
  acceptedFileTypes: string;
}

const DEFAULT_MAX_IMAGES = 10;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const DEFAULT_MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50 MB

const ACCEPTED_FILE_TYPES =
  "image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/svg+xml";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Manages a collection of images for upload, including:
 * - File-type and size validation
 * - Automatic SVG → PNG rasterization (AI vision APIs don't accept SVG)
 * - Screen/window capture via `getDisplayMedia`
 * - Preview URL generation
 *
 * @example
 * ```tsx
 * const { images, addImages, removeImage, fileInputRef, acceptedFileTypes } =
 *   useImageUpload({ maxImages: 5 });
 * ```
 */
export function useImageUpload(
  options: UseImageUploadOptions = {},
): UseImageUploadReturn {
  const {
    maxImages = DEFAULT_MAX_IMAGES,
    maxFileSizeBytes = DEFAULT_MAX_FILE_SIZE,
    maxTotalSizeBytes = DEFAULT_MAX_TOTAL_SIZE,
  } = options;

  const [images, setImages] = useState<ImageItem[]>([]);
  const [sourceType, setSourceType] = useState<ImageSourceType>("upload");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const errors: string[] = [];
      const valid: File[] = [];

      const currentCount = images.length;
      const currentSize = images.reduce((sum, img) => sum + img.file.size, 0);

      const maxFileSizeMB = Math.round(maxFileSizeBytes / (1024 * 1024));
      const maxTotalSizeMB = Math.round(maxTotalSizeBytes / (1024 * 1024));

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          errors.push(`${file.name}: Not an image file`);
          continue;
        }

        if (file.size > maxFileSizeBytes) {
          errors.push(`${file.name}: File exceeds ${maxFileSizeMB} MB`);
          continue;
        }

        if (currentCount + valid.length >= maxImages) {
          errors.push(`Maximum ${maxImages} images allowed`);
          break;
        }

        const newTotalSize =
          currentSize +
          valid.reduce((sum, f) => sum + f.size, 0) +
          file.size;
        if (newTotalSize > maxTotalSizeBytes) {
          errors.push(`Total size exceeds ${maxTotalSizeMB} MB`);
          break;
        }

        valid.push(file);
      }

      return { valid, errors };
    },
    [images, maxImages, maxFileSizeBytes, maxTotalSizeBytes],
  );

  const addImages = useCallback(
    async (files: File[]) => {
      // Rasterize any SVG files to PNG before validation
      const rasterized: File[] = [];
      const rasterizeErrors: string[] = [];

      for (const file of files) {
        if (file.type === "image/svg+xml") {
          try {
            rasterized.push(await rasterizeSvg(file));
          } catch {
            rasterizeErrors.push(
              `${file.name}: Could not convert SVG to PNG`,
            );
          }
        } else {
          rasterized.push(file);
        }
      }

      const { valid, errors } = validateFiles(rasterized);
      const allErrors = [...rasterizeErrors, ...errors];

      setError(allErrors.length > 0 ? allErrors.join(". ") : "");

      if (valid.length === 0) return;

      const newImages: ImageItem[] = await Promise.all(
        valid.map(
          (file) =>
            new Promise<ImageItem>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve({
                  file,
                  preview: e.target?.result as string,
                  id: generateId(),
                });
              };
              reader.readAsDataURL(file);
            }),
        ),
      );

      setImages((prev) => [...prev, ...newImages]);
      setSourceType("upload");
    },
    [validateFiles],
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    setError("");
  }, []);

  const clearAllImages = useCallback(() => {
    setImages([]);
    setError("");
  }, []);

  const captureScreen = useCallback(async () => {
    try {
      setError("");

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" } as MediaTrackConstraints,
        audio: false,
      });

      const video = document.createElement("video");
      video.srcObject = stream;
      await video.play();

      // Brief wait to ensure first frame is rendered
      await new Promise((resolve) => setTimeout(resolve, 100));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);

      stream.getTracks().forEach((track) => track.stop());

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png");
      });

      const file = new File([blob], `screenshot-${Date.now()}.png`, {
        type: "image/png",
      });

      const { valid, errors } = validateFiles([file]);
      if (errors.length > 0) {
        setError(errors.join(". "));
        return;
      }

      if (valid.length > 0) {
        const preview = canvas.toDataURL("image/png");
        setImages((prev) => [
          ...prev,
          { file: valid[0], preview, id: generateId() },
        ]);
        setSourceType("screen_capture");
      }
    } catch (err) {
      // NotAllowedError = user cancelled the picker — not an error worth surfacing
      if ((err as Error).name !== "NotAllowedError") {
        setError("Failed to capture screen. Please try again.");
      }
    }
  }, [validateFiles]);

  return {
    images,
    sourceType,
    error,
    setError,
    addImages,
    removeImage,
    clearAllImages,
    captureScreen,
    validateFiles,
    fileInputRef,
    acceptedFileTypes: ACCEPTED_FILE_TYPES,
  };
}
