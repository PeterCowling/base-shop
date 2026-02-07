/**
 * Rectangle Operations - 2D rectangle mathematics
 *
 * Pure functional rectangle operations for geometry calculations.
 * All functions are immutable - they return new objects rather than mutating inputs.
 *
 * The Rect type uses x/y origin with width/height dimensions. For browser-style
 * left/top format, use conversion functions or directly access x/y as left/top.
 *
 * Use cases:
 * - Bounding box calculations
 * - Hit testing and collision detection
 * - Layout alignment and distribution
 * - Canvas coordinate transformations
 *
 * @module math/geometry/rect
 */

import type { Vector2 } from "./vector";
import { vec2 } from "./vector";

// =============================================================================
// Types
// =============================================================================

/**
 * A 2D axis-aligned rectangle defined by position and size.
 *
 * Uses x/y for origin (top-left corner) with width/height for dimensions.
 * Compatible with browser's getBoundingClientRect() when using x as left, y as top.
 *
 * @example
 * ```typescript
 * const box: Rect = { x: 10, y: 20, width: 100, height: 50 };
 * ```
 */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * A 2D axis-aligned bounding box defined by min/max coordinates.
 *
 * @example
 * ```typescript
 * const bounds: Bounds = { minX: 0, minY: 0, maxX: 100, maxY: 50 };
 * ```
 */
export interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

// =============================================================================
// Construction
// =============================================================================

/**
 * Creates a rectangle from position and size.
 *
 * @param x - X coordinate of top-left corner
 * @param y - Y coordinate of top-left corner
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @returns A new Rect
 *
 * @example
 * ```typescript
 * const r = rect(10, 20, 100, 50);
 * // { x: 10, y: 20, width: 100, height: 50 }
 * ```
 */
export function rect(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

/**
 * Creates a rectangle from a bounds object.
 *
 * @param bounds - The bounds to convert
 * @returns A new Rect
 *
 * @example
 * ```typescript
 * rectFromBounds({ minX: 10, minY: 20, maxX: 110, maxY: 70 });
 * // { x: 10, y: 20, width: 100, height: 50 }
 * ```
 */
export function rectFromBounds(bounds: Bounds): Rect {
  return {
    x: bounds.minX,
    y: bounds.minY,
    width: bounds.maxX - bounds.minX,
    height: bounds.maxY - bounds.minY,
  };
}

/**
 * Creates a rectangle from two corner points.
 *
 * Handles points in any order (automatically finds min/max).
 *
 * @param p1 - First corner point
 * @param p2 - Opposite corner point
 * @returns A normalized Rect with positive width/height
 *
 * @example
 * ```typescript
 * rectFromPoints({ x: 100, y: 100 }, { x: 0, y: 0 });
 * // { x: 0, y: 0, width: 100, height: 100 }
 * ```
 */
export function rectFromPoints(p1: Vector2, p2: Vector2): Rect {
  const minX = Math.min(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxX = Math.max(p1.x, p2.x);
  const maxY = Math.max(p1.y, p2.y);
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Creates a rectangle centered at a point.
 *
 * @param center - The center point
 * @param width - Width of the rectangle
 * @param height - Height of the rectangle
 * @returns A new Rect centered at the given point
 *
 * @example
 * ```typescript
 * rectFromCenter({ x: 50, y: 50 }, 100, 60);
 * // { x: 0, y: 20, width: 100, height: 60 }
 * ```
 */
export function rectFromCenter(center: Vector2, width: number, height: number): Rect {
  return {
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
  };
}

/**
 * Converts a rectangle to a bounds object.
 *
 * @param r - The rectangle to convert
 * @returns A Bounds object
 *
 * @example
 * ```typescript
 * boundsFromRect({ x: 10, y: 20, width: 100, height: 50 });
 * // { minX: 10, minY: 20, maxX: 110, maxY: 70 }
 * ```
 */
export function boundsFromRect(r: Rect): Bounds {
  return {
    minX: r.x,
    minY: r.y,
    maxX: r.x + r.width,
    maxY: r.y + r.height,
  };
}

// =============================================================================
// Properties
// =============================================================================

/**
 * Gets the center point of a rectangle.
 *
 * @param r - The rectangle
 * @returns Center point as Vector2
 *
 * @example
 * ```typescript
 * center({ x: 0, y: 0, width: 100, height: 50 });
 * // { x: 50, y: 25 }
 * ```
 */
export function center(r: Rect): Vector2 {
  return vec2(r.x + r.width / 2, r.y + r.height / 2);
}

/**
 * Calculates the area of a rectangle.
 *
 * @param r - The rectangle
 * @returns Area (width * height)
 *
 * @example
 * ```typescript
 * area({ x: 0, y: 0, width: 10, height: 5 }); // 50
 * ```
 */
export function area(r: Rect): number {
  return r.width * r.height;
}

/**
 * Calculates the perimeter of a rectangle.
 *
 * @param r - The rectangle
 * @returns Perimeter (2 * (width + height))
 *
 * @example
 * ```typescript
 * perimeter({ x: 0, y: 0, width: 10, height: 5 }); // 30
 * ```
 */
export function perimeter(r: Rect): number {
  return 2 * (r.width + r.height);
}

/**
 * Gets the four corner points of a rectangle.
 *
 * Returns corners in order: top-left, top-right, bottom-right, bottom-left (clockwise).
 *
 * @param r - The rectangle
 * @returns Array of four corner points
 *
 * @example
 * ```typescript
 * corners({ x: 0, y: 0, width: 100, height: 50 });
 * // [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }]
 * ```
 */
export function corners(r: Rect): [Vector2, Vector2, Vector2, Vector2] {
  return [
    vec2(r.x, r.y), // top-left
    vec2(r.x + r.width, r.y), // top-right
    vec2(r.x + r.width, r.y + r.height), // bottom-right
    vec2(r.x, r.y + r.height), // bottom-left
  ];
}

// =============================================================================
// Tests
// =============================================================================

/**
 * Tests if a rectangle contains a point.
 *
 * Points exactly on the edge are considered inside.
 *
 * @param r - The rectangle
 * @param p - The point to test
 * @returns True if the point is inside or on the edge of the rectangle
 *
 * @example
 * ```typescript
 * const box = { x: 0, y: 0, width: 100, height: 50 };
 * containsPoint(box, { x: 50, y: 25 });  // true
 * containsPoint(box, { x: 0, y: 0 });    // true (edge)
 * containsPoint(box, { x: 101, y: 25 }); // false
 * ```
 */
export function containsPoint(r: Rect, p: Vector2): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height;
}

/**
 * Tests if one rectangle fully contains another.
 *
 * @param outer - The outer rectangle
 * @param inner - The inner rectangle to test
 * @returns True if inner is completely inside outer
 *
 * @example
 * ```typescript
 * const outer = { x: 0, y: 0, width: 100, height: 100 };
 * const inner = { x: 10, y: 10, width: 20, height: 20 };
 * containsRect(outer, inner); // true
 * ```
 */
export function containsRect(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/**
 * Tests if two rectangles overlap.
 *
 * Uses strict inequality - touching edges return false.
 *
 * @param a - First rectangle
 * @param b - Second rectangle
 * @returns True if the rectangles overlap
 *
 * @example
 * ```typescript
 * const a = { x: 0, y: 0, width: 10, height: 10 };
 * const b = { x: 5, y: 5, width: 10, height: 10 };
 * const c = { x: 10, y: 0, width: 10, height: 10 }; // touching
 * intersects(a, b); // true
 * intersects(a, c); // false (only touching edge)
 * ```
 */
export function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// =============================================================================
// Operations
// =============================================================================

/**
 * Computes the intersection of two rectangles.
 *
 * @param a - First rectangle
 * @param b - Second rectangle
 * @returns Intersection rectangle, or null if they don't overlap
 *
 * @example
 * ```typescript
 * const a = { x: 0, y: 0, width: 10, height: 10 };
 * const b = { x: 5, y: 5, width: 10, height: 10 };
 * intersection(a, b);
 * // { x: 5, y: 5, width: 5, height: 5 }
 * ```
 */
export function intersection(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);

  if (right <= x || bottom <= y) {
    return null;
  }

  return { x, y, width: right - x, height: bottom - y };
}

/**
 * Computes the bounding box that contains both rectangles.
 *
 * @param a - First rectangle
 * @param b - Second rectangle
 * @returns Bounding rectangle containing both
 *
 * @example
 * ```typescript
 * const a = { x: 0, y: 0, width: 10, height: 10 };
 * const b = { x: 20, y: 20, width: 10, height: 10 };
 * union(a, b);
 * // { x: 0, y: 0, width: 30, height: 30 }
 * ```
 */
export function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const right = Math.max(a.x + a.width, b.x + b.width);
  const bottom = Math.max(a.y + a.height, b.y + b.height);
  return { x, y, width: right - x, height: bottom - y };
}

/**
 * Expands a rectangle by a given amount on all sides.
 *
 * Use negative values to shrink the rectangle.
 *
 * @param r - The rectangle
 * @param amount - Amount to expand (or shrink if negative)
 * @returns Expanded rectangle
 *
 * @example
 * ```typescript
 * expand({ x: 10, y: 10, width: 80, height: 80 }, 10);
 * // { x: 0, y: 0, width: 100, height: 100 }
 * ```
 */
export function expand(r: Rect, amount: number): Rect {
  return {
    x: r.x - amount,
    y: r.y - amount,
    width: r.width + 2 * amount,
    height: r.height + 2 * amount,
  };
}

/**
 * Translates a rectangle by a given offset.
 *
 * @param r - The rectangle
 * @param offset - The translation offset
 * @returns Translated rectangle
 *
 * @example
 * ```typescript
 * translate({ x: 0, y: 0, width: 100, height: 50 }, { x: 10, y: 20 });
 * // { x: 10, y: 20, width: 100, height: 50 }
 * ```
 */
export function translate(r: Rect, offset: Vector2): Rect {
  return {
    x: r.x + offset.x,
    y: r.y + offset.y,
    width: r.width,
    height: r.height,
  };
}

/**
 * Scales a rectangle by a factor, optionally from a given origin.
 *
 * @param r - The rectangle
 * @param factor - Scale factor
 * @param origin - Origin point for scaling (defaults to rectangle center)
 * @returns Scaled rectangle
 *
 * @example
 * ```typescript
 * scale({ x: 0, y: 0, width: 100, height: 50 }, 2);
 * // { x: -50, y: -25, width: 200, height: 100 } (scaled from center)
 *
 * scale({ x: 0, y: 0, width: 100, height: 50 }, 2, { x: 0, y: 0 });
 * // { x: 0, y: 0, width: 200, height: 100 } (scaled from origin)
 * ```
 */
export function scale(r: Rect, factor: number, origin?: Vector2): Rect {
  const o = origin ?? center(r);
  return {
    x: o.x + (r.x - o.x) * factor,
    y: o.y + (r.y - o.y) * factor,
    width: r.width * factor,
    height: r.height * factor,
  };
}

/**
 * Clamps a point to be within a rectangle's bounds.
 *
 * @param r - The rectangle to clamp to
 * @param p - The point to clamp
 * @returns Clamped point
 *
 * @example
 * ```typescript
 * const box = { x: 0, y: 0, width: 100, height: 50 };
 * clamp(box, { x: 150, y: 25 });  // { x: 100, y: 25 }
 * clamp(box, { x: -10, y: -10 }); // { x: 0, y: 0 }
 * ```
 */
export function clamp(r: Rect, p: Vector2): Vector2 {
  return vec2(
    Math.max(r.x, Math.min(r.x + r.width, p.x)),
    Math.max(r.y, Math.min(r.y + r.height, p.y))
  );
}

/**
 * Normalizes a rectangle to have positive width and height.
 *
 * Handles rectangles with negative dimensions by adjusting position.
 *
 * @param r - The rectangle to normalize
 * @returns Normalized rectangle with positive dimensions
 *
 * @example
 * ```typescript
 * normalize({ x: 100, y: 100, width: -50, height: -30 });
 * // { x: 50, y: 70, width: 50, height: 30 }
 * ```
 */
export function normalize(r: Rect): Rect {
  let { x, y, width, height } = r;
  if (width < 0) {
    x = x + width;
    width = -width;
  }
  if (height < 0) {
    y = y + height;
    height = -height;
  }
  return { x, y, width, height };
}

/**
 * Tests if two rectangles are equal within a tolerance.
 *
 * @param a - First rectangle
 * @param b - Second rectangle
 * @param epsilon - Tolerance for floating point comparison (default: 0)
 * @returns True if rectangles are equal within tolerance
 *
 * @example
 * ```typescript
 * equals(
 *   { x: 0, y: 0, width: 100, height: 50 },
 *   { x: 0, y: 0, width: 100, height: 50 }
 * ); // true
 * ```
 */
export function equals(a: Rect, b: Rect, epsilon: number = 0): boolean {
  return (
    Math.abs(a.x - b.x) <= epsilon &&
    Math.abs(a.y - b.y) <= epsilon &&
    Math.abs(a.width - b.width) <= epsilon &&
    Math.abs(a.height - b.height) <= epsilon
  );
}
