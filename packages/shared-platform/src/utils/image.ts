/**
 * Browser-side image utilities.
 * These helpers rely on browser APIs (FileReader, HTMLCanvasElement) and must
 * only be imported from client components.
 */

/**
 * Rasterize an SVG File to a PNG File using the browser Canvas API.
 *
 * AI vision APIs (OpenAI, Gemini, Claude) and most cloud storage providers do
 * not accept SVGs. This utility converts an SVG to a raster PNG transparently,
 * preserving the SVG's intrinsic dimensions where available.
 *
 * @param svgFile - An `image/svg+xml` File object.
 * @returns A new `image/png` File with the same base name (`.svg` → `.png`).
 */
export function rasterizeSvg(svgFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () =>
      reject(new Error(`Failed to read SVG: ${svgFile.name}`));

    reader.onload = (e) => {
      const svgDataUrl = e.target?.result as string;
      const img = new Image();

      img.onerror = () =>
        reject(new Error(`Failed to load SVG: ${svgFile.name}`));

      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Use intrinsic SVG dimensions; fall back to a sensible default
        canvas.width = img.naturalWidth || 1200;
        canvas.height = img.naturalHeight || 900;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error(`Failed to rasterize SVG: ${svgFile.name}`));
            return;
          }
          const pngName = svgFile.name.replace(/\.svg$/i, ".png");
          resolve(new File([blob], pngName, { type: "image/png" }));
        }, "image/png");
      };

      img.src = svgDataUrl;
    };

    reader.readAsDataURL(svgFile);
  });
}
