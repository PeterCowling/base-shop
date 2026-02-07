/**
 * Geometry Module - 2D and 3D geometric primitives
 *
 * Provides vector, rectangle, and matrix operations for geometric calculations.
 * All functions are pure and immutable - they return new objects rather than mutating inputs.
 *
 * @module math/geometry
 *
 * @example
 * ```typescript
 * import {
 *   vec2, add, normalize, magnitude,
 *   rect, containsPoint, intersects,
 *   translate, rotate, multiply, transformPoint
 * } from '@acme/lib/math/geometry';
 *
 * // Vector operations
 * const velocity = vec2(3, 4);
 * const direction = normalize(velocity);
 * const speed = magnitude(velocity); // 5
 *
 * // Rectangle operations
 * const box = rect(0, 0, 100, 50);
 * const isInside = containsPoint(box, vec2(50, 25)); // true
 *
 * // Matrix transformations
 * const transform = multiply(translate(10, 20), rotate(Math.PI / 4));
 * const point = transformPoint(transform, vec2(0, 0)); // { x: 10, y: 20 }
 * ```
 */

// Vector types and operations
export type { Vector2, Vector3 } from "./vector";
export {
  // Vector2 Arithmetic
  add,
  // Vector3 Operations
  add3,
  // Vector2 Angles
  angle,
  angleBetween,
  cross,
  cross2D,
  distance,
  distance3,
  distanceSquared,
  distanceSquared3,
  div,
  div3,
  // Vector2 Products
  dot,
  dot3,
  // Vector2 Interpolation & Projection
  lerp as lerpVec2,
  lerp3 as lerpVec3,
  // Vector2 Magnitude
  magnitude,
  magnitude3,
  magnitudeSquared,
  magnitudeSquared3,
  mul,
  mul3,
  negate,
  negate3,
  normalize,
  normalize3,
  perpendicular,
  project,
  reflect,
  rotate as rotateVec2,
  sub,
  sub3,
  UNIT_X,
  UNIT_X3,
  UNIT_Y,
  UNIT_Y3,
  UNIT_Z3,
  // Construction
  vec2,
  vec3,
  // Constants
  ZERO2,
  ZERO3,
} from "./vector";

// Rectangle types and operations
export type { Bounds,Rect } from "./rect";
export {
  area,
  boundsFromRect,
  // Properties
  center,
  clamp as clampPoint,
  // Tests
  containsPoint,
  containsRect,
  corners,
  expand,
  // Operations
  intersection,
  intersects,
  normalize as normalizeRect,
  perimeter,
  // Construction
  rect,
  rectFromBounds,
  rectFromCenter,
  rectFromPoints,
  equals as rectsEqual,
  scale as scaleRect,
  translate as translateRect,
  union,
} from "./rect";

// Matrix types and operations
export type { Matrix3x3, TransformComponents } from "./matrix";
export {
  // Decomposition
  decompose,
  determinant,
  fromTransform,
  // Constants
  IDENTITY,
  identity,
  inverse,
  // Operations
  multiply,
  rotate,
  scale,
  skew,
  // Application
  transformPoint,
  transformVector,
  // Construction
  translate,
  transpose,
} from "./matrix";
