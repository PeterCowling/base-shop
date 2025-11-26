"use client";

export interface ResizeResult {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Resize an image file to fit within maxPx on the longest side.
 * Preserves format (jpeg/png/webp) and strips metadata via canvas re-encode.
 */
export async function resizeImageToMaxPx(file: File, maxPx = 1600): Promise<ResizeResult> {
  const type = file.type || "image/jpeg";
  const bitmap = await createImageBitmap(file);
  const { width: w, height: h } = bitmap;
  let width = w;
  let height = h;
  if (Math.max(w, h) > maxPx) {
    if (w >= h) {
      width = maxPx;
      height = Math.round((h / w) * maxPx);
    } else {
      height = maxPx;
      width = Math.round((w / h) * maxPx);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas 2D not supported"); // i18n-exempt -- UI-1420 diagnostics [ttl=2025-12-31]
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to encode image"))), type, 0.92); // i18n-exempt -- UI-1420 diagnostics [ttl=2025-12-31]
  });
  return { blob, width, height };
}
