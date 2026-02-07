/**
 * Animation Easing Tokens
 *
 * Centralized easing presets as design tokens using cubic-bezier values
 * from @acme/lib. These are exposed as CSS custom properties for consistent
 * animation timing across the design system.
 *
 * Usage in CSS:
 * ```css
 * .element {
 *   transition: transform 200ms var(--ease-out);
 * }
 * ```
 *
 * Usage in Tailwind:
 * ```html
 * <div class="transition-transform duration-200 ease-[var(--ease-out)]">
 * ```
 */

import type { TokenRecord } from "./tokens.extensions";

// ============================================================================
// Cubic Bezier Values (matching @acme/lib/math/animation/bezier presets)
// ============================================================================

/**
 * Standard CSS easing values as cubic-bezier strings
 */
export const EASING_VALUES = {
  // Standard CSS easings
  linear: "linear",
  ease: "cubic-bezier(0.25, 0.1, 0.25, 1.0)",
  easeIn: "cubic-bezier(0.42, 0, 1.0, 1.0)",
  easeOut: "cubic-bezier(0, 0, 0.58, 1.0)",
  easeInOut: "cubic-bezier(0.42, 0, 0.58, 1.0)",

  // Quint (dramatic acceleration/deceleration - Material Design style)
  easeOutQuint: "cubic-bezier(0.22, 1, 0.36, 1)",
  easeInOutQuint: "cubic-bezier(0.86, 0, 0.07, 1)",

  // Back (overshoot effects)
  easeInOutBack: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
  easeOutBack: "cubic-bezier(0.34, 1.56, 0.64, 1)",

  // Expo (sharp transitions for overlays/modals)
  easeOutExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
  easeInExpo: "cubic-bezier(0.7, 0, 0.84, 0)",

  // Circ (circular motion feel)
  easeOutCirc: "cubic-bezier(0, 0.55, 0.45, 1)",
  easeInCirc: "cubic-bezier(0.55, 0, 1, 0.45)",
} as const;

// ============================================================================
// Semantic Easing Aliases
// ============================================================================

/**
 * Semantic easing aliases for common UI patterns
 *
 * These provide intention-revealing names that map to appropriate easings
 * for specific interaction types.
 */
export const SEMANTIC_EASINGS = {
  /** Default easing for most transitions */
  default: EASING_VALUES.ease,

  /** Entering elements (modals, dropdowns, tooltips) */
  enter: EASING_VALUES.easeOut,

  /** Exiting elements */
  exit: EASING_VALUES.easeIn,

  /** Emphasis/attention animations (scale pops, shakes) */
  emphasis: EASING_VALUES.easeOutBack,

  /** Page/route transitions */
  page: EASING_VALUES.easeInOut,

  /** Micro-interactions (hover states, toggles) */
  micro: EASING_VALUES.easeOutQuint,

  /** Overlay/modal transitions (sharp, confident) */
  overlay: EASING_VALUES.easeOutExpo,

  /** Spring-like bounce for playful interactions */
  bounce: EASING_VALUES.easeOutBack,

  /** Smooth scroll or drag interactions */
  smooth: EASING_VALUES.easeInOut,
} as const;

// ============================================================================
// CSS Custom Properties (Token Export)
// ============================================================================

/**
 * Easing tokens as CSS custom properties
 *
 * Merge with EXTENDED_TOKENS or use directly in token generation.
 */
export const EASING_TOKENS: TokenRecord = {
  // Standard easings
  "--ease-linear": EASING_VALUES.linear,
  "--ease-default": EASING_VALUES.ease,
  "--ease-in": EASING_VALUES.easeIn,
  "--ease-out": EASING_VALUES.easeOut,
  "--ease-in-out": EASING_VALUES.easeInOut,

  // Dramatic easings (Material Design style)
  "--ease-out-quint": EASING_VALUES.easeOutQuint,
  "--ease-in-out-quint": EASING_VALUES.easeInOutQuint,

  // Overshoot/bounce easings
  "--ease-out-back": EASING_VALUES.easeOutBack,
  "--ease-in-out-back": EASING_VALUES.easeInOutBack,

  // Expo easings (sharp transitions)
  "--ease-out-expo": EASING_VALUES.easeOutExpo,
  "--ease-in-expo": EASING_VALUES.easeInExpo,

  // Circular easings
  "--ease-out-circ": EASING_VALUES.easeOutCirc,
  "--ease-in-circ": EASING_VALUES.easeInCirc,

  // Semantic aliases (for intention-revealing usage)
  "--ease-enter": SEMANTIC_EASINGS.enter,
  "--ease-exit": SEMANTIC_EASINGS.exit,
  "--ease-emphasis": SEMANTIC_EASINGS.emphasis,
  "--ease-page": SEMANTIC_EASINGS.page,
  "--ease-micro": SEMANTIC_EASINGS.micro,
  "--ease-overlay": SEMANTIC_EASINGS.overlay,
  "--ease-bounce": SEMANTIC_EASINGS.bounce,
  "--ease-smooth": SEMANTIC_EASINGS.smooth,
};

// ============================================================================
// Duration Tokens
// ============================================================================

/**
 * Animation duration tokens
 *
 * Consistent timing values for different interaction types.
 * Based on research showing:
 * - <100ms feels instant
 * - 100-300ms is optimal for UI transitions
 * - >300ms can feel sluggish for frequent interactions
 */
export const DURATION_TOKENS: TokenRecord = {
  "--duration-instant": "0ms",
  "--duration-fastest": "50ms",
  "--duration-faster": "100ms",
  "--duration-fast": "150ms",
  "--duration-normal": "200ms",
  "--duration-slow": "300ms",
  "--duration-slower": "400ms",
  "--duration-slowest": "500ms",

  // Semantic durations
  "--duration-micro": "100ms", // Hover, toggle
  "--duration-short": "150ms", // Tooltips, small overlays
  "--duration-medium": "200ms", // Modals, dropdowns
  "--duration-long": "300ms", // Page transitions, large overlays
};

// ============================================================================
// Combined Animation Tokens
// ============================================================================

/**
 * All animation-related tokens combined
 *
 * Use this to extend EXTENDED_TOKENS in tokens.extensions.ts
 */
export const ANIMATION_TOKENS: TokenRecord = {
  ...EASING_TOKENS,
  ...DURATION_TOKENS,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a transition shorthand value
 *
 * @param property - CSS property to transition
 * @param duration - Duration token name (without --) or ms value
 * @param easing - Easing token name (without --) or cubic-bezier value
 * @returns CSS transition value string
 *
 * @example
 * ```typescript
 * const transition = createTransition("transform", "duration-normal", "ease-out");
 * // "transform var(--duration-normal) var(--ease-out)"
 *
 * const custom = createTransition("opacity", "200ms", "ease-in");
 * // "opacity 200ms var(--ease-in)"
 * ```
 */
export function createTransition(
  property: string,
  duration: string,
  easing: string
): string {
  const durationValue = duration.includes("ms") || duration.includes("s")
    ? duration
    : `var(--${duration})`;

  const easingValue = easing.startsWith("cubic-bezier") || easing === "linear"
    ? easing
    : `var(--${easing})`;

  return `${property} ${durationValue} ${easingValue}`;
}

/**
 * Create multiple transitions
 *
 * @param transitions - Array of [property, duration, easing] tuples
 * @returns Combined CSS transition value
 *
 * @example
 * ```typescript
 * const value = createTransitions([
 *   ["transform", "duration-fast", "ease-out"],
 *   ["opacity", "duration-normal", "ease-in-out"],
 * ]);
 * // "transform var(--duration-fast) var(--ease-out), opacity var(--duration-normal) var(--ease-in-out)"
 * ```
 */
export function createTransitions(
  transitions: [string, string, string][]
): string {
  return transitions
    .map(([prop, dur, ease]) => createTransition(prop, dur, ease))
    .join(", ");
}
