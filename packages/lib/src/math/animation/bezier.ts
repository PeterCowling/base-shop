/**
 * Bézier Easing Functions - Custom animation timing
 *
 * Cubic Bézier curves for smooth, customizable animation easing.
 * Compatible with CSS `cubic-bezier()` timing function.
 *
 * Use cases:
 * - Smooth transitions beyond CSS defaults
 * - Consistent brand-specific animation feel
 * - Programmatic animation control in canvas/WebGL
 *
 * @see https://cubic-bezier.com/ - Visual Bézier curve tool
 */

/**
 * An easing function that maps progress [0,1] to eased value [0,1]
 * (output may exceed [0,1] for overshoot effects)
 */
export type EasingFunction = (t: number) => number;

// Newton-Raphson iteration settings
const NEWTON_ITERATIONS = 4;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 0.0000001;
const SUBDIVISION_MAX_ITERATIONS = 10;

// Sample table size for initial approximation
const SPLINE_TABLE_SIZE = 11;
const SAMPLE_STEP_SIZE = 1.0 / (SPLINE_TABLE_SIZE - 1.0);

/**
 * Calculate the polynomial coefficients for the Bézier curve
 */
function A(a1: number, a2: number): number {
  return 1.0 - 3.0 * a2 + 3.0 * a1;
}

function B(a1: number, a2: number): number {
  return 3.0 * a2 - 6.0 * a1;
}

function C(a1: number): number {
  return 3.0 * a1;
}

/**
 * Calculate x(t) or y(t) given t and the control points
 */
function calcBezier(t: number, a1: number, a2: number): number {
  return ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
}

/**
 * Calculate the derivative dx/dt or dy/dt
 */
function getSlope(t: number, a1: number, a2: number): number {
  return 3.0 * A(a1, a2) * t * t + 2.0 * B(a1, a2) * t + C(a1);
}

/**
 * Binary subdivision to find t for a given x
 */
function binarySubdivide(
  x: number,
  a: number,
  b: number,
  x1: number,
  x2: number
): number {
  let currentX: number;
  let currentT: number;
  let i = 0;

  do {
    currentT = a + (b - a) / 2.0;
    currentX = calcBezier(currentT, x1, x2) - x;
    if (currentX > 0.0) {
      b = currentT;
    } else {
      a = currentT;
    }
  } while (
    Math.abs(currentX) > SUBDIVISION_PRECISION &&
    ++i < SUBDIVISION_MAX_ITERATIONS
  );

  return currentT;
}

/**
 * Newton-Raphson iteration to refine t for a given x
 */
function newtonRaphsonIterate(
  x: number,
  guessT: number,
  x1: number,
  x2: number
): number {
  for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
    const currentSlope = getSlope(guessT, x1, x2);
    if (currentSlope === 0.0) {
      return guessT;
    }
    const currentX = calcBezier(guessT, x1, x2) - x;
    guessT -= currentX / currentSlope;
  }
  return guessT;
}

/**
 * Creates a cubic Bézier easing function.
 *
 * The curve is defined by two control points (x1, y1) and (x2, y2).
 * The start point is implicitly (0, 0) and end point is (1, 1).
 *
 * This matches the CSS `cubic-bezier(x1, y1, x2, y2)` timing function.
 *
 * @param x1 - X coordinate of first control point (0-1)
 * @param y1 - Y coordinate of first control point (can be outside 0-1 for overshoot)
 * @param x2 - X coordinate of second control point (0-1)
 * @param y2 - Y coordinate of second control point (can be outside 0-1 for overshoot)
 * @returns An easing function that maps t ∈ [0,1] to eased progress
 *
 * @example
 * ```typescript
 * const ease = cubicBezier(0.25, 0.1, 0.25, 1.0);
 * ease(0);   // 0
 * ease(0.5); // ~0.8 (eased midpoint)
 * ease(1);   // 1
 * ```
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): EasingFunction {
  // Validate x coordinates are in valid range
  if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new Error(
      "Bézier x values must be in [0, 1]. Got x1=" + x1 + ", x2=" + x2
    );
  }

  // Linear case optimization
  if (x1 === y1 && x2 === y2) {
    return (t: number) => t;
  }

  // Pre-compute sample table for fast initial guess
  const sampleValues = new Float32Array(SPLINE_TABLE_SIZE);
  for (let i = 0; i < SPLINE_TABLE_SIZE; ++i) {
    sampleValues[i] = calcBezier(i * SAMPLE_STEP_SIZE, x1, x2);
  }

  /**
   * Find the t value for a given x using the sample table + refinement
   */
  function getTForX(x: number): number {
    let intervalStart = 0.0;
    let currentSample = 1;
    const lastSample = SPLINE_TABLE_SIZE - 1;

    // Find the interval containing x
    for (
      ;
      currentSample !== lastSample && sampleValues[currentSample] <= x;
      ++currentSample
    ) {
      intervalStart += SAMPLE_STEP_SIZE;
    }
    --currentSample;

    // Interpolate to get initial guess
    const dist =
      (x - sampleValues[currentSample]) /
      (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    const guessForT = intervalStart + dist * SAMPLE_STEP_SIZE;

    // Refine using Newton-Raphson or binary subdivision
    const initialSlope = getSlope(guessForT, x1, x2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(x, guessForT, x1, x2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(
        x,
        intervalStart,
        intervalStart + SAMPLE_STEP_SIZE,
        x1,
        x2
      );
    }
  }

  return function bezierEasing(t: number): number {
    // Handle edge cases
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    return calcBezier(getTForX(t), y1, y2);
  };
}

// ============================================================================
// Standard Easing Presets
// ============================================================================

/**
 * Linear easing (no easing)
 */
export const linear: EasingFunction = (t) => t;

/**
 * CSS ease - subtle acceleration and deceleration
 * Equivalent to cubic-bezier(0.25, 0.1, 0.25, 1.0)
 */
export const ease: EasingFunction = cubicBezier(0.25, 0.1, 0.25, 1.0);

/**
 * CSS ease-in - starts slow, accelerates
 * Equivalent to cubic-bezier(0.42, 0, 1.0, 1.0)
 */
export const easeIn: EasingFunction = cubicBezier(0.42, 0, 1.0, 1.0);

/**
 * CSS ease-out - starts fast, decelerates
 * Equivalent to cubic-bezier(0, 0, 0.58, 1.0)
 */
export const easeOut: EasingFunction = cubicBezier(0, 0, 0.58, 1.0);

/**
 * CSS ease-in-out - slow start and end
 * Equivalent to cubic-bezier(0.42, 0, 0.58, 1.0)
 */
export const easeInOut: EasingFunction = cubicBezier(0.42, 0, 0.58, 1.0);

/**
 * Quint ease-out - dramatic deceleration (Material Design style)
 * Equivalent to cubic-bezier(0.22, 1, 0.36, 1)
 */
export const easeOutQuint: EasingFunction = cubicBezier(0.22, 1, 0.36, 1);

/**
 * Quint ease-in-out - dramatic acceleration and deceleration
 * Equivalent to cubic-bezier(0.86, 0, 0.07, 1)
 */
export const easeInOutQuint: EasingFunction = cubicBezier(0.86, 0, 0.07, 1);

/**
 * Ease-in-out with overshoot (back effect)
 * Equivalent to cubic-bezier(0.68, -0.55, 0.265, 1.55)
 */
export const easeInOutBack: EasingFunction = cubicBezier(
  0.68,
  -0.55,
  0.265,
  1.55
);

/**
 * Ease-out with overshoot (back effect)
 * Equivalent to cubic-bezier(0.34, 1.56, 0.64, 1)
 */
export const easeOutBack: EasingFunction = cubicBezier(0.34, 1.56, 0.64, 1);

// ============================================================================
// Spring Physics Easing
// ============================================================================

/**
 * Creates a spring-based easing function.
 *
 * Uses a damped harmonic oscillator model for natural-feeling motion.
 *
 * @param tension - Spring stiffness (higher = faster, snappier). Typical: 100-500
 * @param friction - Damping coefficient (higher = less bounce). Typical: 10-40
 * @returns An easing function with spring-like motion
 *
 * @example
 * ```typescript
 * const springy = spring(180, 12);  // Bouncy spring
 * const stiff = spring(400, 30);    // Stiff, minimal bounce
 * ```
 */
export function spring(tension: number, friction: number): EasingFunction {
  if (tension <= 0) {
    throw new Error("Spring tension must be positive");
  }
  if (friction < 0) {
    throw new Error("Spring friction must be non-negative");
  }

  // Pre-calculate damping parameters
  const omega = Math.sqrt(tension);
  const zeta = friction / (2 * Math.sqrt(tension));

  return function springEasing(t: number): number {
    if (t <= 0) return 0;
    if (t >= 1) return 1;

    if (zeta < 1) {
      // Under-damped (oscillates)
      const omegaD = omega * Math.sqrt(1 - zeta * zeta);
      const decay = Math.exp(-zeta * omega * t);
      return (
        1 - decay * (Math.cos(omegaD * t) + (zeta * omega / omegaD) * Math.sin(omegaD * t))
      );
    } else if (zeta === 1) {
      // Critically damped (no oscillation, fastest settling)
      const decay = Math.exp(-omega * t);
      return 1 - decay * (1 + omega * t);
    } else {
      // Over-damped (slow settling, no oscillation)
      const s1 = -omega * (zeta + Math.sqrt(zeta * zeta - 1));
      const s2 = -omega * (zeta - Math.sqrt(zeta * zeta - 1));
      const c2 = -s1 / (s2 - s1);
      const c1 = 1 - c2;
      return 1 - (c1 * Math.exp(s1 * t) + c2 * Math.exp(s2 * t));
    }
  };
}

// ============================================================================
// Interpolation Utilities
// ============================================================================

/**
 * Linear interpolation between two values.
 *
 * @param a - Start value
 * @param b - End value
 * @param t - Progress (0-1)
 * @returns Interpolated value
 *
 * @example
 * ```typescript
 * lerp(0, 100, 0.5);   // 50
 * lerp(10, 20, 0.25);  // 12.5
 * ```
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Inverse linear interpolation - find t given a value between a and b.
 *
 * @param a - Start value
 * @param b - End value
 * @param value - The value to find t for
 * @returns The t value (0-1) where lerp(a, b, t) === value
 *
 * @example
 * ```typescript
 * inverseLerp(0, 100, 50);   // 0.5
 * inverseLerp(10, 20, 12.5); // 0.25
 * ```
 */
export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return (value - a) / (b - a);
}

/**
 * Remap a value from one range to another.
 *
 * @param value - The value to remap
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns The remapped value
 *
 * @example
 * ```typescript
 * remap(50, 0, 100, 0, 1);     // 0.5
 * remap(0.5, 0, 1, 100, 200);  // 150
 * remap(5, 0, 10, 0, 360);     // 180
 * ```
 */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  const t = inverseLerp(inMin, inMax, value);
  return lerp(outMin, outMax, t);
}

/**
 * Clamp a value to a range.
 *
 * @param value - The value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Clamp progress to [0, 1] range.
 */
export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}
