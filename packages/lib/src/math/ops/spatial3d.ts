import { clamp01 } from "../animation/bezier.js";

export interface Vec3Like {
  x?: number;
  y?: number;
  z?: number;
}

export type FitMode = "contain" | "height" | "width";

export interface PerspectiveFitOptions {
  width: number;
  height: number;
  fovDegrees: number;
  aspectRatio: number;
  fill?: number;
  fit?: FitMode;
}

/**
 * Clamp vector components into [0, 1] with a finite fallback.
 */
export function clamp01Vec3(
  vector: Vec3Like | null | undefined,
  fallback: number = 0.5,
): { x: number; y: number; z: number } {
  const safeFallback = Number.isFinite(fallback) ? fallback : 0.5;
  const source = vector ?? {};
  const x = typeof source.x === "number" && Number.isFinite(source.x) ? source.x : safeFallback;
  const y = typeof source.y === "number" && Number.isFinite(source.y) ? source.y : safeFallback;
  const z = typeof source.z === "number" && Number.isFinite(source.z) ? source.z : safeFallback;
  return {
    x: clamp01(x),
    y: clamp01(y),
    z: clamp01(z),
  };
}

/**
 * Compute camera distance needed to frame bounds in perspective projection.
 */
export function fitPerspectiveDistance(options: PerspectiveFitOptions): number {
  const width = Math.max(options.width, 0.001);
  const height = Math.max(options.height, 0.001);
  const fill = Number.isFinite(options.fill) ? Math.max(0.01, options.fill as number) : 0.9;
  const aspect = Math.max(options.aspectRatio, 0.001);
  const fit = options.fit ?? "contain";

  const fovRadians = (options.fovDegrees * Math.PI) / 180;
  const fitHeight = (height / 2) / (Math.tan(fovRadians / 2) * fill);
  const fitWidth = (width / 2) / (Math.tan(fovRadians / 2) * aspect * fill);

  if (fit === "height") {
    return fitHeight;
  }
  if (fit === "width") {
    return fitWidth;
  }
  return Math.max(fitHeight, fitWidth);
}

/**
 * Return true when a projected point should be culled by screen margin.
 */
export function screenMarginCull(
  projectedX: number,
  projectedY: number,
  margin: number,
): boolean {
  const maxScreen = 1 - margin;
  return Math.abs(projectedX) > maxScreen || Math.abs(projectedY) > maxScreen;
}

/**
 * Return true when two points are closer than the minimum spacing.
 */
export function minDistanceCull(
  dx: number,
  dy: number,
  minimumDistance: number,
): boolean {
  return Math.hypot(dx, dy) < minimumDistance;
}
