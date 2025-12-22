// src/lib/getIntrinsicSize.ts
import manifest from "@/data/imageDimensions.json";
import type { ImageDims } from "@/types/image";

const dimCache = new Map<string, ImageDims>();

export function getIntrinsicSize(src: string): ImageDims | undefined {
  if (dimCache.has(src)) return dimCache.get(src);
  const dims = (manifest as Record<string, ImageDims>)[src]; // ← cast is fine
  if (dims) dimCache.set(src, dims);
  return dims;
}
