import { normalPpf, studentTPpf } from "./internal/special-functions";

export interface ConfidenceIntervalResult {
  estimate: number;
  lower: number;
  upper: number;
  halfWidth: number;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
}

function assertOpenUnitInterval(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0 || value >= 1) {
    throw new RangeError(`${name} must be in (0, 1)`);
  }
}

function assertPositiveInteger(value: number, name: string): void {
  assertFinite(value, name);
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function assertNonNegativeInteger(value: number, name: string): void {
  assertFinite(value, name);
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
}

function zCriticalForLevel(confidenceLevel: number): number {
  const alpha = 1 - confidenceLevel;
  return normalPpf(1 - alpha / 2);
}

function tCriticalForLevel(confidenceLevel: number, degreesOfFreedom: number): number {
  const alpha = 1 - confidenceLevel;
  return studentTPpf(1 - alpha / 2, degreesOfFreedom);
}

function halfWidthFromBounds(lower: number, upper: number): number {
  return (upper - lower) / 2;
}

function validateProportionInputs(successes: number, total: number): void {
  assertNonNegativeInteger(successes, "successes");
  assertPositiveInteger(total, "total");
  if (successes > total) {
    throw new RangeError("successes must be <= total");
  }
}

function validateMeanInputs(stddev: number, n: number): void {
  assertFinite(stddev, "stddev");
  assertPositiveInteger(n, "n");
  if (stddev < 0) {
    throw new RangeError("stddev must be >= 0");
  }
  if (n < 2) {
    throw new RangeError("n must be >= 2");
  }
}

function wilsonInterval(
  successes: number,
  total: number,
  confidenceLevel: number
): ConfidenceIntervalResult {
  validateProportionInputs(successes, total);

  const p = successes / total;
  const z = zCriticalForLevel(confidenceLevel);
  const z2 = z * z;
  const denominator = 1 + z2 / total;
  const center = (p + z2 / (2 * total)) / denominator;
  const adjustedSpread =
    (z *
      Math.sqrt((p * (1 - p)) / total + z2 / (4 * total * total))) /
    denominator;

  const lower = Math.max(0, center - adjustedSpread);
  const upper = Math.min(1, center + adjustedSpread);

  return {
    estimate: p,
    lower,
    upper,
    halfWidth: halfWidthFromBounds(lower, upper),
  };
}

function welchDegreesOfFreedom(
  stddev1: number,
  n1: number,
  stddev2: number,
  n2: number
): number {
  const varianceTerm1 = (stddev1 * stddev1) / n1;
  const varianceTerm2 = (stddev2 * stddev2) / n2;
  const numerator = (varianceTerm1 + varianceTerm2) ** 2;
  const denominator =
    (varianceTerm1 * varianceTerm1) / (n1 - 1) +
    (varianceTerm2 * varianceTerm2) / (n2 - 1);

  if (denominator <= 0) {
    throw new RangeError("Welch degrees-of-freedom denominator is zero");
  }

  return numerator / denominator;
}

export function proportionConfidenceInterval(
  successes: number,
  total: number,
  confidenceLevel = 0.95
): ConfidenceIntervalResult {
  assertOpenUnitInterval(confidenceLevel, "confidenceLevel");
  return wilsonInterval(successes, total, confidenceLevel);
}

export function meanConfidenceInterval(
  mean: number,
  stddev: number,
  n: number,
  confidenceLevel = 0.95
): ConfidenceIntervalResult {
  assertFinite(mean, "mean");
  assertOpenUnitInterval(confidenceLevel, "confidenceLevel");
  validateMeanInputs(stddev, n);

  const tCritical = tCriticalForLevel(confidenceLevel, n - 1);
  const halfWidth = tCritical * (stddev / Math.sqrt(n));
  const lower = mean - halfWidth;
  const upper = mean + halfWidth;

  return {
    estimate: mean,
    lower,
    upper,
    halfWidth,
  };
}

export function proportionDifferenceCI(
  successes1: number,
  total1: number,
  successes2: number,
  total2: number,
  confidenceLevel = 0.95
): ConfidenceIntervalResult {
  assertOpenUnitInterval(confidenceLevel, "confidenceLevel");
  validateProportionInputs(successes1, total1);
  validateProportionInputs(successes2, total2);

  // Newcombe-Wilson hybrid: build Wilson intervals for each arm and combine.
  const interval1 = wilsonInterval(successes1, total1, confidenceLevel);
  const interval2 = wilsonInterval(successes2, total2, confidenceLevel);

  // d12 = p1 - p2
  const d12 = interval1.estimate - interval2.estimate;
  const lower12 =
    d12 -
    Math.sqrt(
      (interval1.estimate - interval1.lower) ** 2 +
        (interval2.upper - interval2.estimate) ** 2
    );
  const upper12 =
    d12 +
    Math.sqrt(
      (interval1.upper - interval1.estimate) ** 2 +
        (interval2.estimate - interval2.lower) ** 2
    );

  // Return treatment-minus-control style estimate (second minus first).
  const estimate = -d12;
  const lower = -upper12;
  const upper = -lower12;

  return {
    estimate,
    lower,
    upper,
    halfWidth: halfWidthFromBounds(lower, upper),
  };
}

export function meanDifferenceCI(
  ...args: [number, number, number, number, number, number, number?]
): ConfidenceIntervalResult {
  const [mean1, stddev1, n1, mean2, stddev2, n2, confidenceLevel = 0.95] = args;
  assertFinite(mean1, "mean1");
  assertFinite(mean2, "mean2");
  assertOpenUnitInterval(confidenceLevel, "confidenceLevel");
  validateMeanInputs(stddev1, n1);
  validateMeanInputs(stddev2, n2);

  const estimate = mean2 - mean1;
  const standardError = Math.sqrt(
    (stddev1 * stddev1) / n1 + (stddev2 * stddev2) / n2
  );
  if (standardError <= 0) {
    throw new RangeError("standard error is zero; mean difference CI is undefined");
  }

  const df = welchDegreesOfFreedom(stddev1, n1, stddev2, n2);
  const tCritical = tCriticalForLevel(confidenceLevel, df);
  const halfWidth = tCritical * standardError;
  const lower = estimate - halfWidth;
  const upper = estimate + halfWidth;

  return {
    estimate,
    lower,
    upper,
    halfWidth,
  };
}
