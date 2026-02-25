/**
 * Clamp read size to [0, maxBytes] with integer semantics.
 */
export function boundedReadSize(fileSizeBytes: number, maxBytes: number): number {
  if (!Number.isFinite(fileSizeBytes) || !Number.isFinite(maxBytes) || maxBytes <= 0) {
    return 0;
  }

  const size = Math.max(0, Math.floor(fileSizeBytes));
  const ceiling = Math.max(0, Math.floor(maxBytes));
  return Math.min(size, ceiling);
}

/**
 * Return the shorter edge of an image.
 */
export function shortestEdge(width: number, height: number): number {
  return Math.min(width, height);
}

/**
 * Validate image size against a minimum shortest-edge requirement.
 */
export function validateMinImageEdge(
  width: number,
  height: number,
  minEdgePx: number,
): boolean {
  return shortestEdge(width, height) >= minEdgePx;
}
