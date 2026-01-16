import type { Document } from "@gltf-transform/core";

export function estimateTextureMemoryBytes(document: Document) {
  const MAX_TEX_DIMENSION = 16384;
  let totalBytes = 0;
  for (const texture of document.getRoot().listTextures()) {
    const size = texture.getSize();
    if (!size || !Number.isFinite(size[0]) || !Number.isFinite(size[1])) continue;
    if (size[0] <= 0 || size[1] <= 0) continue;
    if (size[0] > MAX_TEX_DIMENSION || size[1] > MAX_TEX_DIMENSION) continue;
    totalBytes += size[0] * size[1] * 4;
  }
  return totalBytes;
}

export function estimateTextureMemoryMB(document: Document) {
  return estimateTextureMemoryBytes(document) / (1024 * 1024);
}
