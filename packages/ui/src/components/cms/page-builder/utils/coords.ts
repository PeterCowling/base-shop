// Utility functions for converting between screen (client) coordinates
// and logical canvas coordinates when the canvas is scaled via CSS transform.
//
// Note: This module uses left/top style coordinates for DOM compatibility.
// For general-purpose geometry, use @acme/lib/math/geometry.

import {
  add as addVec,
  intersects as rectIntersects,
  mul as mulVec,
  rect as libRect,
  sub as subVec,
  type Vector2,
} from "@acme/lib";

/**
 * Point in screen/canvas coordinates (DOM-style x/y)
 * @see Vector2 from @acme/lib/math/geometry for general vector operations
 */
export type Point = Vector2;

/**
 * Rectangle in DOM style (left/top origin)
 * Note: @acme/lib/math/geometry uses x/y origin which is equivalent
 */
export type Rect = { left: number; top: number; width: number; height: number };

/** Minimum zoom to prevent division by zero */
const MIN_ZOOM = 0.0001;

/**
 * Convert screen coordinates to canvas coordinates, accounting for zoom.
 */
export function screenToCanvas(
  client: Point,
  canvasRect: DOMRect | { left: number; top: number },
  zoom = 1,
): Point {
  const safeZoom = Math.max(zoom, MIN_ZOOM);
  return mulVec(
    { x: client.x - canvasRect.left, y: client.y - canvasRect.top },
    1 / safeZoom,
  );
}

/**
 * Convert a screen-space rectangle to canvas coordinates, accounting for zoom.
 */
export function rectScreenToCanvas(
  rect: Rect,
  canvasRect: DOMRect | { left: number; top: number },
  zoom = 1,
): Rect {
  const safeZoom = Math.max(zoom, MIN_ZOOM);
  return {
    left: (rect.left - canvasRect.left) / safeZoom,
    top: (rect.top - canvasRect.top) / safeZoom,
    width: rect.width / safeZoom,
    height: rect.height / safeZoom,
  };
}

/**
 * Add two points.
 * @see add from @acme/lib/math/geometry
 */
export function addPoints(a: Point, b: Point): Point {
  return addVec(a, b);
}

/**
 * Subtract two points.
 * @see sub from @acme/lib/math/geometry
 */
export function subPoints(a: Point, b: Point): Point {
  return subVec(a, b);
}

/**
 * Clamp rectangle dimensions to non-negative values.
 */
export function clampRectToPositive(r: Rect): Rect {
  return {
    left: Math.max(0, r.left),
    top: Math.max(0, r.top),
    width: Math.max(0, r.width),
    height: Math.max(0, r.height),
  };
}

/**
 * Calculate drag delta in canvas space from screen-space start/current points.
 */
export function normalizeDragDelta(
  start: Point,
  current: Point,
  zoom = 1,
): Point {
  const safeZoom = Math.max(zoom, MIN_ZOOM);
  return mulVec(subVec(current, start), 1 / safeZoom);
}

/**
 * Check if two rectangles intersect.
 * @see intersects from @acme/lib/math/geometry
 */
export function rectsIntersect(a: Rect, b: Rect): boolean {
  // Convert left/top to x/y for library compatibility
  return rectIntersects(
    libRect(a.left, a.top, a.width, a.height),
    libRect(b.left, b.top, b.width, b.height),
  );
}

