import type { Document } from "@gltf-transform/core";

export function estimateTextureMemoryBytes(document: Document) {
  let totalBytes = 0;
  for (const texture of document.getRoot().listTextures()) {
    const size = texture.getSize();
    if (!size || size[0] === 0 || size[1] === 0) continue;
    totalBytes += size[0] * size[1] * 4;
  }
  return totalBytes;
}

export function estimateTextureMemoryMB(document: Document) {
  return estimateTextureMemoryBytes(document) / (1024 * 1024);
}
