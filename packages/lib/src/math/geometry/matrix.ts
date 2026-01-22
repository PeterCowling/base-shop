/**
 * Matrix Operations - 3x3 transformation matrices for 2D graphics
 *
 * Provides 3x3 affine transformation matrices for 2D graphics operations.
 * Matrices are stored in row-major order and represent transformations
 * in homogeneous coordinates.
 *
 * Matrix layout (row-major):
 * ```
 * | m0  m1  m2 |   | a  b  tx |
 * | m3  m4  m5 | = | c  d  ty |
 * | m6  m7  m8 |   | 0  0  1  |
 * ```
 *
 * All functions are pure - they return new matrices rather than mutating inputs.
 *
 * Use cases:
 * - 2D transformations (translate, rotate, scale, skew)
 * - Canvas rendering transformations
 * - SVG/CSS transform decomposition
 * - Coordinate system conversions
 *
 * @module math/geometry/matrix
 */

import type { Vector2 } from "./vector";
import { vec2 } from "./vector";

// =============================================================================
// Types
// =============================================================================

/**
 * A 3x3 matrix stored as a readonly tuple in row-major order.
 *
 * For 2D affine transformations, the last row is always [0, 0, 1].
 *
 * @example
 * ```typescript
 * // Identity matrix
 * const m: Matrix3x3 = [
 *   1, 0, 0,
 *   0, 1, 0,
 *   0, 0, 1
 * ];
 *
 * // Translation matrix (tx=10, ty=20)
 * const t: Matrix3x3 = [
 *   1, 0, 10,
 *   0, 1, 20,
 *   0, 0, 1
 * ];
 * ```
 */
export type Matrix3x3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

/**
 * Decomposed transformation components.
 */
export interface TransformComponents {
  readonly translation: Vector2;
  readonly rotation: number;
  readonly scale: Vector2;
  readonly skew: Vector2;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * The identity matrix (no transformation).
 *
 * @example
 * ```typescript
 * transformPoint(IDENTITY, { x: 10, y: 20 }); // { x: 10, y: 20 }
 * ```
 */
export const IDENTITY: Matrix3x3 = Object.freeze([1, 0, 0, 0, 1, 0, 0, 0, 1]) as Matrix3x3;

// =============================================================================
// Construction
// =============================================================================

/**
 * Creates a translation matrix.
 *
 * @param tx - X translation
 * @param ty - Y translation
 * @returns Translation matrix
 *
 * @example
 * ```typescript
 * const m = translate(10, 20);
 * transformPoint(m, { x: 0, y: 0 }); // { x: 10, y: 20 }
 * ```
 */
export function translate(tx: number, ty: number): Matrix3x3 {
  return [1, 0, tx, 0, 1, ty, 0, 0, 1];
}

/**
 * Creates a rotation matrix.
 *
 * @param radians - Rotation angle in radians (counterclockwise)
 * @returns Rotation matrix
 *
 * @example
 * ```typescript
 * const m = rotate(Math.PI / 2); // 90 degrees counterclockwise
 * transformPoint(m, { x: 1, y: 0 }); // { x: 0, y: 1 } (approximately)
 * ```
 */
export function rotate(radians: number): Matrix3x3 {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [cos, -sin, 0, sin, cos, 0, 0, 0, 1];
}

/**
 * Creates a scaling matrix.
 *
 * @param sx - X scale factor
 * @param sy - Y scale factor (defaults to sx for uniform scaling)
 * @returns Scaling matrix
 *
 * @example
 * ```typescript
 * const m = scale(2, 3);
 * transformPoint(m, { x: 10, y: 10 }); // { x: 20, y: 30 }
 * ```
 */
export function scale(sx: number, sy: number = sx): Matrix3x3 {
  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}

/**
 * Creates a skew/shear matrix.
 *
 * @param sx - X skew angle in radians
 * @param sy - Y skew angle in radians
 * @returns Skew matrix
 *
 * @example
 * ```typescript
 * const m = skew(Math.PI / 4, 0); // 45 degree horizontal skew
 * transformPoint(m, { x: 0, y: 10 }); // { x: 10, y: 10 }
 * ```
 */
export function skew(sx: number, sy: number): Matrix3x3 {
  return [1, Math.tan(sx), 0, Math.tan(sy), 1, 0, 0, 0, 1];
}

/**
 * Creates a transformation matrix from individual components.
 *
 * Applies transformations in order: scale, skew, rotate, translate.
 *
 * @param components - The transformation components
 * @returns Combined transformation matrix
 *
 * @example
 * ```typescript
 * const m = fromTransform({
 *   translation: { x: 100, y: 50 },
 *   rotation: Math.PI / 4,
 *   scale: { x: 2, y: 2 },
 *   skew: { x: 0, y: 0 }
 * });
 * ```
 */
export function fromTransform(components: TransformComponents): Matrix3x3 {
  const { translation, rotation, scale: s, skew: sk } = components;

  // Build the matrix: T * R * Sk * S
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);
  const tanSkX = Math.tan(sk.x);
  const tanSkY = Math.tan(sk.y);

  // Combined matrix computation
  // S * Sk first
  const a = s.x;
  const b = s.x * tanSkX;
  const c = s.y * tanSkY;
  const d = s.y;

  // Then rotate: R * (Sk * S)
  const a2 = a * cosR - c * sinR;
  const b2 = b * cosR - d * sinR;
  const c2 = a * sinR + c * cosR;
  const d2 = b * sinR + d * cosR;

  return [a2, b2, translation.x, c2, d2, translation.y, 0, 0, 1];
}

// =============================================================================
// Operations
// =============================================================================

/**
 * Multiplies two matrices (a * b).
 *
 * Matrix multiplication is not commutative: multiply(a, b) !== multiply(b, a).
 * Transformations are applied right-to-left: multiply(a, b) applies b first, then a.
 *
 * @param a - First matrix (applied second)
 * @param b - Second matrix (applied first)
 * @returns Product matrix
 *
 * @example
 * ```typescript
 * const t = translate(10, 0);
 * const r = rotate(Math.PI / 2);
 * const m = multiply(t, r); // Rotate, then translate
 * ```
 */
export function multiply(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

/**
 * Computes the determinant of a matrix.
 *
 * A non-zero determinant indicates the matrix is invertible.
 *
 * @param m - The matrix
 * @returns The determinant
 *
 * @example
 * ```typescript
 * determinant(IDENTITY); // 1
 * determinant(scale(2, 3)); // 6
 * ```
 */
export function determinant(m: Matrix3x3): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  );
}

/**
 * Computes the inverse of a matrix.
 *
 * @param m - The matrix to invert
 * @returns Inverse matrix, or null if the matrix is singular (non-invertible)
 *
 * @example
 * ```typescript
 * const t = translate(10, 20);
 * const tInv = inverse(t);
 * // tInv is translate(-10, -20)
 *
 * inverse(scale(0, 0)); // null (singular matrix)
 * ```
 */
export function inverse(m: Matrix3x3): Matrix3x3 | null {
  const det = determinant(m);
  if (Math.abs(det) < 1e-10) {
    return null;
  }

  const invDet = 1 / det;

  return [
    (m[4] * m[8] - m[5] * m[7]) * invDet,
    (m[2] * m[7] - m[1] * m[8]) * invDet,
    (m[1] * m[5] - m[2] * m[4]) * invDet,
    (m[5] * m[6] - m[3] * m[8]) * invDet,
    (m[0] * m[8] - m[2] * m[6]) * invDet,
    (m[2] * m[3] - m[0] * m[5]) * invDet,
    (m[3] * m[7] - m[4] * m[6]) * invDet,
    (m[1] * m[6] - m[0] * m[7]) * invDet,
    (m[0] * m[4] - m[1] * m[3]) * invDet,
  ];
}

/**
 * Transposes a matrix (swaps rows and columns).
 *
 * @param m - The matrix to transpose
 * @returns Transposed matrix
 *
 * @example
 * ```typescript
 * transpose([1, 2, 3, 4, 5, 6, 7, 8, 9]);
 * // [1, 4, 7, 2, 5, 8, 3, 6, 9]
 * ```
 */
export function transpose(m: Matrix3x3): Matrix3x3 {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

// =============================================================================
// Application
// =============================================================================

/**
 * Transforms a point by a matrix.
 *
 * Applies the full transformation including translation.
 *
 * @param m - The transformation matrix
 * @param p - The point to transform
 * @returns Transformed point
 *
 * @example
 * ```typescript
 * const m = translate(10, 20);
 * transformPoint(m, { x: 5, y: 5 }); // { x: 15, y: 25 }
 * ```
 */
export function transformPoint(m: Matrix3x3, p: Vector2): Vector2 {
  return vec2(m[0] * p.x + m[1] * p.y + m[2], m[3] * p.x + m[4] * p.y + m[5]);
}

/**
 * Transforms a vector by a matrix (without translation).
 *
 * Use this for directions or deltas where translation should not apply.
 *
 * @param m - The transformation matrix
 * @param v - The vector to transform
 * @returns Transformed vector
 *
 * @example
 * ```typescript
 * const m = translate(10, 20);
 * transformVector(m, { x: 5, y: 5 }); // { x: 5, y: 5 } (no translation)
 *
 * const r = rotate(Math.PI / 2);
 * transformVector(r, { x: 1, y: 0 }); // { x: 0, y: 1 }
 * ```
 */
export function transformVector(m: Matrix3x3, v: Vector2): Vector2 {
  return vec2(m[0] * v.x + m[1] * v.y, m[3] * v.x + m[4] * v.y);
}

// =============================================================================
// Decomposition
// =============================================================================

/**
 * Decomposes a matrix into its transformation components.
 *
 * Extracts translation, rotation, scale, and skew from a transformation matrix.
 * Note: Decomposition may not be unique for all matrices.
 *
 * @param m - The matrix to decompose
 * @returns Transformation components
 *
 * @example
 * ```typescript
 * const m = multiply(translate(10, 20), rotate(Math.PI / 4));
 * const components = decompose(m);
 * // components.translation = { x: 10, y: 20 }
 * // components.rotation = Math.PI / 4
 * ```
 */
export function decompose(m: Matrix3x3): TransformComponents {
  // Extract translation
  const translation = vec2(m[2], m[5]);

  // Extract scale and rotation from the upper-left 2x2
  const a = m[0];
  const b = m[1];
  const c = m[3];
  const d = m[4];

  // Compute scale
  const scaleX = Math.sqrt(a * a + c * c);
  const scaleY = Math.sqrt(b * b + d * d);

  // Determine sign based on determinant of 2x2 portion
  const det2x2 = a * d - b * c;
  const signX = det2x2 < 0 ? -1 : 1;

  // Normalize to get rotation
  const normalizedA = a / scaleX;
  const normalizedC = c / scaleX;

  // Extract rotation
  const rotation = Math.atan2(normalizedC, normalizedA);

  // Extract skew
  // After removing rotation and scale, what remains is skew
  const cosR = Math.cos(rotation);
  const sinR = Math.sin(rotation);

  // Remove rotation to isolate skew * scale
  const r00 = a * cosR + c * sinR;
  const r01 = b * cosR + d * sinR;
  const r10 = -a * sinR + c * cosR;
  const r11 = -b * sinR + d * cosR;

  // Now we have scale * skew matrix:
  // | scaleX    scaleX * tan(skewX) |
  // | scaleY * tan(skewY)    scaleY |

  // Since r00 = scaleX and r11 should be scaleY (approximately)
  // skewX = atan(r01 / r00) and skewY = atan(r10 / r11)
  const skewX = scaleX !== 0 ? Math.atan2(r01, r00) : 0;
  const skewY = scaleY !== 0 ? Math.atan2(r10, r11) : 0;

  return {
    translation,
    rotation,
    scale: vec2(signX * scaleX, scaleY),
    skew: vec2(skewX, skewY),
  };
}

/**
 * Creates an identity matrix.
 *
 * Equivalent to using the IDENTITY constant, but returns a new array.
 *
 * @returns A new identity matrix
 *
 * @example
 * ```typescript
 * const m = identity();
 * // [1, 0, 0, 0, 1, 0, 0, 0, 1]
 * ```
 */
export function identity(): Matrix3x3 {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}
