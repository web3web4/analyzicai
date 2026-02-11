export async function captureScreen(): Promise<Blob> {
  // Request screen capture permission
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { displaySurface: "browser" } as MediaTrackConstraints,
    audio: false,
  });

  // Create video element to capture the stream
  const video = document.createElement("video");
  video.srcObject = stream;
  await video.play();

  // Wait for video to be ready (necessary for some browsers)
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Create canvas and draw the video frame
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(video, 0, 0);

  // Stop all tracks to close the screen sharing
  stream.getTracks().forEach((track) => track.stop());

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob from canvas"));
        }
      },
      "image/png",
      1.0,
    );
  });
}

export async function captureScreenAsBase64(): Promise<string> {
  const blob = await captureScreen();
  return blobToBase64(blob);
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read blob as base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function fileToBase64(file: File): Promise<string> {
  return blobToBase64(file);
}

/**
 * Check if screen capture is supported in the current browser
 */
export function isScreenCaptureSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getDisplayMedia === "function"
  );
}
