import {
  chiSquareSf,
  normalCdf,
  studentTCdf,
} from "./internal/special-functions.js";
import type { AlternativeHypothesis } from "./sample-size.js";

interface WithAlpha {
  alpha?: number;
}

export interface ZTestProportionsOptions extends WithAlpha {
  controlSuccesses: number;
  controlTotal: number;
  treatmentSuccesses: number;
  treatmentTotal: number;
  alternative?: AlternativeHypothesis;
}

export interface ZTestProportionsResult {
  zScore: number;
  pValue: number;
  alternative: AlternativeHypothesis;
  isSignificant?: boolean;
  warnings: string[];
}

export interface WelchTTestOptions extends WithAlpha {
  mean1: number;
  stddev1: number;
  n1: number;
  mean2: number;
  stddev2: number;
  n2: number;
  alternative?: AlternativeHypothesis;
}

export interface WelchTTestResult {
  tStatistic: number;
  degreesOfFreedom: number;
  pValue: number;
  alternative: AlternativeHypothesis;
  isSignificant?: boolean;
}

export interface ChiSquareGoodnessOfFitOptions extends WithAlpha {
  alternative?: AlternativeHypothesis;
}

export interface ChiSquareGoodnessOfFitResult {
  chiSquare: number;
  degreesOfFreedom: number;
  pValue: number;
  alternative: AlternativeHypothesis;
  isSignificant?: boolean;
  warnings: string[];
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
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

function assertOpenUnitInterval(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0 || value >= 1) {
    throw new RangeError(`${name} must be in (0, 1)`);
  }
}

function resolveAlternative(
  alternative: AlternativeHypothesis | undefined,
  defaultAlternative: AlternativeHypothesis = "two-sided"
): AlternativeHypothesis {
  const resolved = alternative ?? defaultAlternative;
  if (
    resolved === "two-sided" ||
    resolved === "greater" ||
    resolved === "less"
  ) {
    return resolved;
  }

  throw new RangeError(
    'alternative must be one of "two-sided", "greater", or "less"'
  );
}

function resolveAlpha(alpha: number | undefined): number | undefined {
  if (alpha === undefined) {
    return undefined;
  }

  assertOpenUnitInterval(alpha, "alpha");
  return alpha;
}

function clampProbability(value: number): number {
  if (value <= 0) {
    return 0;
  }

  if (value >= 1) {
    return 1;
  }

  return value;
}

function pValueFromCdf(
  cdf: number,
  alternative: AlternativeHypothesis
): number {
  const rightTail = 1 - cdf;

  if (alternative === "greater") {
    return clampProbability(rightTail);
  }

  if (alternative === "less") {
    return clampProbability(cdf);
  }

  return clampProbability(2 * Math.min(cdf, rightTail));
}

function significanceFromAlpha(
  pValue: number,
  alpha: number | undefined
): boolean | undefined {
  if (alpha === undefined) {
    return undefined;
  }

  return pValue <= alpha;
}

/**
 * Two-sample z-test for difference in proportions.
 */
export function zTestProportions(
  options: ZTestProportionsOptions
): ZTestProportionsResult {
  const {
    controlSuccesses,
    controlTotal,
    treatmentSuccesses,
    treatmentTotal,
    alternative,
    alpha,
  } = options;

  assertNonNegativeInteger(controlSuccesses, "controlSuccesses");
  assertPositiveInteger(controlTotal, "controlTotal");
  assertNonNegativeInteger(treatmentSuccesses, "treatmentSuccesses");
  assertPositiveInteger(treatmentTotal, "treatmentTotal");

  if (controlSuccesses > controlTotal) {
    throw new RangeError("controlSuccesses must be <= controlTotal");
  }

  if (treatmentSuccesses > treatmentTotal) {
    throw new RangeError("treatmentSuccesses must be <= treatmentTotal");
  }

  const resolvedAlternative = resolveAlternative(alternative, "two-sided");
  const resolvedAlpha = resolveAlpha(alpha);
  const warnings: string[] = [];

  const controlRate = controlSuccesses / controlTotal;
  const treatmentRate = treatmentSuccesses / treatmentTotal;
  const pooledRate =
    (controlSuccesses + treatmentSuccesses) / (controlTotal + treatmentTotal);
  const pooledVariance =
    pooledRate * (1 - pooledRate) * (1 / controlTotal + 1 / treatmentTotal);

  if (pooledVariance <= 0) {
    warnings.push(
      "Pooled variance is zero; z-test is degenerate for these inputs"
    );
    return {
      zScore: 0,
      pValue: 1,
      alternative: resolvedAlternative,
      isSignificant: significanceFromAlpha(1, resolvedAlpha),
      warnings,
    };
  }

  const zScore = (treatmentRate - controlRate) / Math.sqrt(pooledVariance);
  const cdf = normalCdf(zScore);
  const pValue = pValueFromCdf(cdf, resolvedAlternative);

  return {
    zScore,
    pValue,
    alternative: resolvedAlternative,
    isSignificant: significanceFromAlpha(pValue, resolvedAlpha),
    warnings,
  };
}

/**
 * Welch two-sample t-test.
 */
export function welchTTest(options: WelchTTestOptions): WelchTTestResult {
  const {
    mean1,
    stddev1,
    n1,
    mean2,
    stddev2,
    n2,
    alternative,
    alpha,
  } = options;

  assertFinite(mean1, "mean1");
  assertFinite(mean2, "mean2");
  assertFinite(stddev1, "stddev1");
  assertFinite(stddev2, "stddev2");
  assertPositiveInteger(n1, "n1");
  assertPositiveInteger(n2, "n2");

  if (stddev1 < 0 || stddev2 < 0) {
    throw new RangeError("stddev values must be >= 0");
  }

  if (n1 < 2 || n2 < 2) {
    throw new RangeError("n1 and n2 must be >= 2 for Welch t-test");
  }

  const resolvedAlternative = resolveAlternative(alternative, "two-sided");
  const resolvedAlpha = resolveAlpha(alpha);

  const varianceTerm1 = (stddev1 * stddev1) / n1;
  const varianceTerm2 = (stddev2 * stddev2) / n2;
  const standardError = Math.sqrt(varianceTerm1 + varianceTerm2);

  if (standardError <= 0) {
    throw new RangeError("standard error is zero; Welch t-test is undefined");
  }

  // mean1 - mean2 aligns with textbook Welch definitions.
  const tStatistic = (mean1 - mean2) / standardError;
  const numerator = (varianceTerm1 + varianceTerm2) ** 2;
  const denominator =
    (varianceTerm1 * varianceTerm1) / (n1 - 1) +
    (varianceTerm2 * varianceTerm2) / (n2 - 1);

  if (denominator <= 0) {
    throw new RangeError("degrees-of-freedom denominator is zero");
  }

  const degreesOfFreedom = numerator / denominator;
  const cdf = studentTCdf(tStatistic, degreesOfFreedom);
  const pValue = pValueFromCdf(cdf, resolvedAlternative);

  return {
    tStatistic,
    degreesOfFreedom,
    pValue,
    alternative: resolvedAlternative,
    isSignificant: significanceFromAlpha(pValue, resolvedAlpha),
  };
}

/**
 * Chi-square goodness-of-fit test.
 */
export function chiSquareGoodnessOfFit(
  observed: ReadonlyArray<number>,
  expected: ReadonlyArray<number>,
  options: ChiSquareGoodnessOfFitOptions = {}
): ChiSquareGoodnessOfFitResult {
  if (observed.length < 2) {
    throw new RangeError("observed must contain at least two categories");
  }

  if (observed.length !== expected.length) {
    throw new RangeError("observed and expected must have equal length");
  }

  const { alpha, alternative } = options;
  const resolvedAlternative = resolveAlternative(alternative, "greater");
  const resolvedAlpha = resolveAlpha(alpha);
  const warnings: string[] = [];

  let observedSum = 0;
  let expectedSum = 0;
  let chiSquare = 0;

  for (let i = 0; i < observed.length; i++) {
    const observedValue = observed[i];
    const expectedValue = expected[i];

    assertFinite(observedValue, `observed[${i}]`);
    assertFinite(expectedValue, `expected[${i}]`);

    if (observedValue < 0) {
      throw new RangeError(`observed[${i}] must be >= 0`);
    }

    if (expectedValue <= 0) {
      throw new RangeError(`expected[${i}] must be > 0`);
    }

    if (expectedValue < 5) {
      warnings.push(
        `Expected count below 5 at index ${i}; chi-square approximation may be inaccurate`
      );
    }

    observedSum += observedValue;
    expectedSum += expectedValue;
    const diff = observedValue - expectedValue;
    chiSquare += (diff * diff) / expectedValue;
  }

  if (Math.abs(observedSum - expectedSum) > 1e-9) {
    warnings.push(
      "Observed and expected totals differ; ensure expected counts are normalized"
    );
  }

  const degreesOfFreedom = observed.length - 1;
  const sf = chiSquareSf(chiSquare, degreesOfFreedom);
  const cdf = 1 - sf;
  const pValue = pValueFromCdf(cdf, resolvedAlternative);

  return {
    chiSquare,
    degreesOfFreedom,
    pValue,
    alternative: resolvedAlternative,
    isSignificant: significanceFromAlpha(pValue, resolvedAlpha),
    warnings,
  };
}
