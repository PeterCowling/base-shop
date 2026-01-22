/**
 * Vector Operations - 2D and 3D vector mathematics
 *
 * Pure functional vector operations for geometry calculations.
 * All functions are immutable - they return new objects rather than mutating inputs.
 *
 * Use cases:
 * - Coordinate transformations in page builders
 * - 3D product visualizations
 * - Animation interpolation
 * - Physics simulations
 *
 * @module math/geometry/vector
 */

// =============================================================================
// Types
// =============================================================================

/**
 * A 2D vector with x and y components.
 *
 * @example
 * ```typescript
 * const position: Vector2 = { x: 100, y: 200 };
 * const velocity: Vector2 = { x: 5, y: -3 };
 * ```
 */
export interface Vector2 {
  readonly x: number;
  readonly y: number;
}

/**
 * A 3D vector with x, y, and z components.
 *
 * @example
 * ```typescript
 * const position: Vector3 = { x: 1, y: 2, z: 3 };
 * ```
 */
export interface Vector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

// =============================================================================
// Constants
// =============================================================================

/**
 * Zero vector in 2D space.
 *
 * @example
 * ```typescript
 * const origin = ZERO2; // { x: 0, y: 0 }
 * ```
 */
export const ZERO2: Vector2 = Object.freeze({ x: 0, y: 0 });

/**
 * Zero vector in 3D space.
 *
 * @example
 * ```typescript
 * const origin = ZERO3; // { x: 0, y: 0, z: 0 }
 * ```
 */
export const ZERO3: Vector3 = Object.freeze({ x: 0, y: 0, z: 0 });

/**
 * Unit vector pointing in the positive X direction (2D).
 *
 * @example
 * ```typescript
 * const right = UNIT_X; // { x: 1, y: 0 }
 * ```
 */
export const UNIT_X: Vector2 = Object.freeze({ x: 1, y: 0 });

/**
 * Unit vector pointing in the positive Y direction (2D).
 *
 * @example
 * ```typescript
 * const up = UNIT_Y; // { x: 0, y: 1 }
 * ```
 */
export const UNIT_Y: Vector2 = Object.freeze({ x: 0, y: 1 });

/**
 * Unit vector pointing in the positive X direction (3D).
 *
 * @example
 * ```typescript
 * const right = UNIT_X3; // { x: 1, y: 0, z: 0 }
 * ```
 */
export const UNIT_X3: Vector3 = Object.freeze({ x: 1, y: 0, z: 0 });

/**
 * Unit vector pointing in the positive Y direction (3D).
 *
 * @example
 * ```typescript
 * const up = UNIT_Y3; // { x: 0, y: 1, z: 0 }
 * ```
 */
export const UNIT_Y3: Vector3 = Object.freeze({ x: 0, y: 1, z: 0 });

/**
 * Unit vector pointing in the positive Z direction (3D).
 *
 * @example
 * ```typescript
 * const forward = UNIT_Z3; // { x: 0, y: 0, z: 1 }
 * ```
 */
export const UNIT_Z3: Vector3 = Object.freeze({ x: 0, y: 0, z: 1 });

// =============================================================================
// Construction
// =============================================================================

/**
 * Creates a 2D vector.
 *
 * @param x - The x component
 * @param y - The y component
 * @returns A new Vector2
 *
 * @example
 * ```typescript
 * const v = vec2(10, 20); // { x: 10, y: 20 }
 * ```
 */
export function vec2(x: number, y: number): Vector2 {
  return { x, y };
}

/**
 * Creates a 3D vector.
 *
 * @param x - The x component
 * @param y - The y component
 * @param z - The z component
 * @returns A new Vector3
 *
 * @example
 * ```typescript
 * const v = vec3(1, 2, 3); // { x: 1, y: 2, z: 3 }
 * ```
 */
export function vec3(x: number, y: number, z: number): Vector3 {
  return { x, y, z };
}

// =============================================================================
// Vector2 Arithmetic
// =============================================================================

/**
 * Adds two 2D vectors.
 *
 * @param a - First vector
 * @param b - Second vector
 * @returns Sum of the vectors
 *
 * @example
 * ```typescript
 * add({ x: 1, y: 2 }, { x: 3, y: 4 }); // { x: 4, y: 6 }
 * ```
 */
export function add(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

/**
 * Subtracts second vector from first (a - b).
 *
 * @param a - First vector
 * @param b - Second vector (subtracted)
 * @returns Difference of the vectors
 *
 * @example
 * ```typescript
 * sub({ x: 5, y: 7 }, { x: 2, y: 3 }); // { x: 3, y: 4 }
 * ```
 */
export function sub(a: Vector2, b: Vector2): Vector2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Multiplies a vector by a scalar.
 *
 * @param v - The vector
 * @param scalar - The scalar multiplier
 * @returns Scaled vector
 *
 * @example
 * ```typescript
 * mul({ x: 2, y: 3 }, 4); // { x: 8, y: 12 }
 * ```
 */
export function mul(v: Vector2, scalar: number): Vector2 {
  return { x: v.x * scalar, y: v.y * scalar };
}

/**
 * Divides a vector by a scalar.
 *
 * @param v - The vector
 * @param scalar - The scalar divisor
 * @returns Scaled vector
 * @throws Error if scalar is zero
 *
 * @example
 * ```typescript
 * div({ x: 8, y: 12 }, 4); // { x: 2, y: 3 }
 * div({ x: 1, y: 1 }, 0);  // throws Error
 * ```
 */
export function div(v: Vector2, scalar: number): Vector2 {
  if (scalar === 0) {
    throw new Error("Cannot divide vector by zero");
  }
  return { x: v.x / scalar, y: v.y / scalar };
}

/**
 * Negates a vector (reverses direction).
 *
 * @param v - The vector to negate
 * @returns Negated vector
 *
 * @example
 * ```typescript
 * negate({ x: 3, y: -4 }); // { x: -3, y: 4 }
 * ```
 */
export function negate(v: Vector2): Vector2 {
  return { x: -v.x, y: -v.y };
}

// =============================================================================
// Vector2 Products
// =============================================================================

/**
 * Computes the dot product of two 2D vectors.
 *
 * @param a - First vector
 * @param b - Second vector
 * @returns Dot product (scalar)
 *
 * @example
 * ```typescript
 * dot({ x: 1, y: 2 }, { x: 3, y: 4 }); // 11 (1*3 + 2*4)
 * ```
 */
export function dot(a: Vector2, b: Vector2): number {
  return a.x * b.x + a.y * b.y;
}

/**
 * Computes the 2D cross product (z-component of 3D cross product).
 *
 * This is useful for determining the signed area of a parallelogram
 * and the orientation of three points.
 *
 * @param a - First vector
 * @param b - Second vector
 * @returns Z-component of the cross product
 *
 * @example
 * ```typescript
 * cross2D({ x: 1, y: 0 }, { x: 0, y: 1 }); // 1 (counterclockwise)
 * cross2D({ x: 0, y: 1 }, { x: 1, y: 0 }); // -1 (clockwise)
 * ```
 */
export function cross2D(a: Vector2, b: Vector2): number {
  return a.x * b.y - a.y * b.x;
}

// =============================================================================
// Vector2 Magnitude
// =============================================================================

/**
 * Computes the magnitude (length) of a 2D vector.
 *
 * @param v - The vector
 * @returns The magnitude
 *
 * @example
 * ```typescript
 * magnitude({ x: 3, y: 4 }); // 5
 * ```
 */
export function magnitude(v: Vector2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

/**
 * Computes the squared magnitude of a 2D vector.
 *
 * Use this when comparing magnitudes to avoid the sqrt operation.
 *
 * @param v - The vector
 * @returns The squared magnitude
 *
 * @example
 * ```typescript
 * magnitudeSquared({ x: 3, y: 4 }); // 25
 * ```
 */
export function magnitudeSquared(v: Vector2): number {
  return v.x * v.x + v.y * v.y;
}

/**
 * Normalizes a 2D vector to unit length.
 *
 * Returns ZERO2 for zero-length vectors (not NaN/Infinity).
 *
 * @param v - The vector to normalize
 * @returns Unit vector in the same direction, or ZERO2 if input is zero-length
 *
 * @example
 * ```typescript
 * normalize({ x: 3, y: 4 }); // { x: 0.6, y: 0.8 }
 * normalize({ x: 0, y: 0 }); // { x: 0, y: 0 } (ZERO2)
 * ```
 */
export function normalize(v: Vector2): Vector2 {
  const mag = magnitude(v);
  if (mag === 0) {
    return ZERO2;
  }
  return { x: v.x / mag, y: v.y / mag };
}

/**
 * Computes the distance between two 2D points.
 *
 * @param a - First point
 * @param b - Second point
 * @returns Distance between the points
 *
 * @example
 * ```typescript
 * distance({ x: 0, y: 0 }, { x: 3, y: 4 }); // 5
 * ```
 */
export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Computes the squared distance between two 2D points.
 *
 * Use this when comparing distances to avoid the sqrt operation.
 *
 * @param a - First point
 * @param b - Second point
 * @returns Squared distance between the points
 *
 * @example
 * ```typescript
 * distanceSquared({ x: 0, y: 0 }, { x: 3, y: 4 }); // 25
 * ```
 */
export function distanceSquared(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

// =============================================================================
// Vector2 Angles
// =============================================================================

/**
 * Computes the angle of a vector from the positive X axis.
 *
 * @param v - The vector
 * @returns Angle in radians (-PI to PI)
 *
 * @example
 * ```typescript
 * angle({ x: 1, y: 0 });  // 0
 * angle({ x: 0, y: 1 });  // PI/2
 * angle({ x: -1, y: 0 }); // PI
 * angle({ x: 0, y: -1 }); // -PI/2
 * ```
 */
export function angle(v: Vector2): number {
  return Math.atan2(v.y, v.x);
}

/**
 * Computes the angle between two vectors.
 *
 * Returns 0 for zero-length vectors.
 *
 * @param a - First vector
 * @param b - Second vector
 * @returns Angle in radians (0 to PI)
 *
 * @example
 * ```typescript
 * angleBetween({ x: 1, y: 0 }, { x: 0, y: 1 }); // PI/2
 * angleBetween({ x: 1, y: 0 }, { x: -1, y: 0 }); // PI
 * angleBetween({ x: 1, y: 0 }, { x: 0, y: 0 }); // 0 (zero-length vector)
 * ```
 */
export function angleBetween(a: Vector2, b: Vector2): number {
  const magA = magnitude(a);
  const magB = magnitude(b);
  if (magA === 0 || magB === 0) {
    return 0;
  }
  const cosAngle = dot(a, b) / (magA * magB);
  // Clamp to handle floating point errors
  return Math.acos(Math.max(-1, Math.min(1, cosAngle)));
}

/**
 * Rotates a 2D vector by the given angle.
 *
 * @param v - The vector to rotate
 * @param radians - Rotation angle in radians (counterclockwise)
 * @returns Rotated vector
 *
 * @example
 * ```typescript
 * rotate({ x: 1, y: 0 }, Math.PI / 2); // { x: 0, y: 1 } (approximately)
 * ```
 */
export function rotate(v: Vector2, radians: number): Vector2 {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
}

// =============================================================================
// Vector2 Interpolation & Projection
// =============================================================================

/**
 * Linearly interpolates between two 2D vectors.
 *
 * @param a - Start vector
 * @param b - End vector
 * @param t - Interpolation factor (0-1 for standard interpolation)
 * @returns Interpolated vector
 *
 * @example
 * ```typescript
 * lerp({ x: 0, y: 0 }, { x: 10, y: 20 }, 0.5); // { x: 5, y: 10 }
 * ```
 */
export function lerp(a: Vector2, b: Vector2, t: number): Vector2 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * Reflects a vector off a surface with the given normal.
 *
 * @param v - The incident vector
 * @param normal - The surface normal (should be normalized)
 * @returns Reflected vector
 *
 * @example
 * ```typescript
 * // Ball bouncing off horizontal surface
 * reflect({ x: 1, y: -1 }, { x: 0, y: 1 }); // { x: 1, y: 1 }
 * ```
 */
export function reflect(v: Vector2, normal: Vector2): Vector2 {
  const d = 2 * dot(v, normal);
  return {
    x: v.x - d * normal.x,
    y: v.y - d * normal.y,
  };
}

/**
 * Projects vector a onto vector b.
 *
 * @param a - The vector to project
 * @param b - The vector to project onto
 * @returns Projection of a onto b
 *
 * @example
 * ```typescript
 * project({ x: 3, y: 4 }, { x: 1, y: 0 }); // { x: 3, y: 0 }
 * ```
 */
export function project(a: Vector2, b: Vector2): Vector2 {
  const bMagSq = magnitudeSquared(b);
  if (bMagSq === 0) {
    return ZERO2;
  }
  const scalar = dot(a, b) / bMagSq;
  return mul(b, scalar);
}

/**
 * Returns a vector perpendicular to the input (rotated 90 degrees counterclockwise).
 *
 * @param v - The input vector
 * @returns Perpendicular vector
 *
 * @example
 * ```typescript
 * perpendicular({ x: 1, y: 0 }); // { x: 0, y: 1 }
 * perpendicular({ x: 0, y: 1 }); // { x: -1, y: 0 }
 * ```
 */
export function perpendicular(v: Vector2): Vector2 {
  return { x: -v.y, y: v.x };
}

// =============================================================================
// Vector3 Operations
// =============================================================================

/**
 * Adds two 3D vectors.
 *
 * @param a - First vector
 * @param b - Second vector
 * @returns Sum of the vectors
 *
 * @example
 * ```typescript
 * add3({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 }); // { x: 5, y: 7, z: 9 }
 * ```
 */
export function add3(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/**
 * Subtracts second 3D vector from first (a - b).
 *
 * @param a - First vector
 * @param b - Second vector (subtracted)
 * @returns Difference of the vectors
 *
 * @example
 * ```typescript
 * sub3({ x: 5, y: 7, z: 9 }, { x: 1, y: 2, z: 3 }); // { x: 4, y: 5, z: 6 }
 * ```
 */
export function sub3(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/**
 * Multiplies a 3D vector by a scalar.
 *
 * @param v - The vector
 * @param scalar - The scalar multiplier
 * @returns Scaled vector
 *
 * @example
 * ```typescript
 * mul3({ x: 1, y: 2, z: 3 }, 2); // { x: 2, y: 4, z: 6 }
 * ```
 */
export function mul3(v: Vector3, scalar: number): Vector3 {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
}

/**
 * Computes the dot product of two 3D vectors.
 *
 * @param a - First vector
 * @param b - Second vector
 * @returns Dot product (scalar)
 *
 * @example
 * ```typescript
 * dot3({ x: 1, y: 2, z: 3 }, { x: 4, y: 5, z: 6 }); // 32 (1*4 + 2*5 + 3*6)
 * ```
 */
export function dot3(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Computes the cross product of two 3D vectors.
 *
 * @param a - First vector
 * @param b - Second vector
 * @returns Cross product vector
 *
 * @example
 * ```typescript
 * cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }); // { x: 0, y: 0, z: 1 }
 * ```
 */
export function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Computes the magnitude (length) of a 3D vector.
 *
 * @param v - The vector
 * @returns The magnitude
 *
 * @example
 * ```typescript
 * magnitude3({ x: 2, y: 3, z: 6 }); // 7
 * ```
 */
export function magnitude3(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Computes the squared magnitude of a 3D vector.
 *
 * @param v - The vector
 * @returns The squared magnitude
 *
 * @example
 * ```typescript
 * magnitudeSquared3({ x: 2, y: 3, z: 6 }); // 49
 * ```
 */
export function magnitudeSquared3(v: Vector3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z;
}

/**
 * Normalizes a 3D vector to unit length.
 *
 * Returns ZERO3 for zero-length vectors (not NaN/Infinity).
 *
 * @param v - The vector to normalize
 * @returns Unit vector in the same direction, or ZERO3 if input is zero-length
 *
 * @example
 * ```typescript
 * normalize3({ x: 0, y: 0, z: 5 }); // { x: 0, y: 0, z: 1 }
 * normalize3({ x: 0, y: 0, z: 0 }); // { x: 0, y: 0, z: 0 } (ZERO3)
 * ```
 */
export function normalize3(v: Vector3): Vector3 {
  const mag = magnitude3(v);
  if (mag === 0) {
    return ZERO3;
  }
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

/**
 * Computes the distance between two 3D points.
 *
 * @param a - First point
 * @param b - Second point
 * @returns Distance between the points
 *
 * @example
 * ```typescript
 * distance3({ x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 6 }); // 7
 * ```
 */
export function distance3(a: Vector3, b: Vector3): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Computes the squared distance between two 3D points.
 *
 * @param a - First point
 * @param b - Second point
 * @returns Squared distance between the points
 *
 * @example
 * ```typescript
 * distanceSquared3({ x: 0, y: 0, z: 0 }, { x: 2, y: 3, z: 6 }); // 49
 * ```
 */
export function distanceSquared3(a: Vector3, b: Vector3): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return dx * dx + dy * dy + dz * dz;
}

/**
 * Linearly interpolates between two 3D vectors.
 *
 * @param a - Start vector
 * @param b - End vector
 * @param t - Interpolation factor (0-1 for standard interpolation)
 * @returns Interpolated vector
 *
 * @example
 * ```typescript
 * lerp3({ x: 0, y: 0, z: 0 }, { x: 10, y: 20, z: 30 }, 0.5);
 * // { x: 5, y: 10, z: 15 }
 * ```
 */
export function lerp3(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Negates a 3D vector (reverses direction).
 *
 * @param v - The vector to negate
 * @returns Negated vector
 *
 * @example
 * ```typescript
 * negate3({ x: 1, y: -2, z: 3 }); // { x: -1, y: 2, z: -3 }
 * ```
 */
export function negate3(v: Vector3): Vector3 {
  return { x: -v.x, y: -v.y, z: -v.z };
}

/**
 * Divides a 3D vector by a scalar.
 *
 * @param v - The vector
 * @param scalar - The scalar divisor
 * @returns Scaled vector
 * @throws Error if scalar is zero
 *
 * @example
 * ```typescript
 * div3({ x: 6, y: 9, z: 12 }, 3); // { x: 2, y: 3, z: 4 }
 * div3({ x: 1, y: 1, z: 1 }, 0);  // throws Error
 * ```
 */
export function div3(v: Vector3, scalar: number): Vector3 {
  if (scalar === 0) {
    throw new Error("Cannot divide vector by zero");
  }
  return { x: v.x / scalar, y: v.y / scalar, z: v.z / scalar };
}
