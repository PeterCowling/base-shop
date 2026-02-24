export type RateScale = "ratio" | "percent" | "bps";

export interface RateToBpsResult {
  bps: number;
  scale: RateScale;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Convert a numeric count into a whole number.
 * Returns null for null/undefined/non-finite inputs.
 */
export function toWholeCount(value: number | null | undefined): number | null {
  if (!isFiniteNumber(value)) {
    return null;
  }
  return Math.round(value);
}

/**
 * Convert a major currency value (e.g. euros) to minor units (e.g. cents).
 * Returns null for null/undefined/non-finite inputs.
 */
export function toCents(value: number | null | undefined): number | null {
  if (!isFiniteNumber(value)) {
    return null;
  }
  return Math.round(value * 100);
}

/**
 * Convert ratio (0-1) to basis points.
 */
export function bpsFromRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) {
    throw new RangeError("Ratio must be a finite number");
  }
  return Math.round(ratio * 10000);
}

/**
 * Convert a rate in ratio/percent/bps form to bps with source-scale metadata.
 *
 * Heuristic:
 * - |value| <= 1 => ratio
 * - |value| <= 100 => percent
 * - otherwise => already in bps
 */
export function rateToBps(value: number | null | undefined): RateToBpsResult | null {
  if (!isFiniteNumber(value)) {
    return null;
  }

  const absValue = Math.abs(value);
  if (absValue <= 1) {
    return { bps: bpsFromRatio(value), scale: "ratio" };
  }
  if (absValue <= 100) {
    return { bps: Math.round(value * 100), scale: "percent" };
  }
  return { bps: Math.round(value), scale: "bps" };
}

/**
 * Safe rounded division.
 * Returns null when inputs are null/undefined/non-finite or denominator is zero.
 */
export function safeDivideRound(
  numerator: number | null | undefined,
  denominator: number | null | undefined,
): number | null {
  if (!isFiniteNumber(numerator) || !isFiniteNumber(denominator) || denominator === 0) {
    return null;
  }
  return Math.round(numerator / denominator);
}

/**
 * Parse any value to a positive integer using floor semantics.
 */
export function toPositiveInt(
  value: unknown,
  fallback: number,
  minimum: number = 1,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum) {
    return fallback;
  }
  return Math.floor(parsed);
}
