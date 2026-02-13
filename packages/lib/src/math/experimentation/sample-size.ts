import { normalPpf } from "./internal/special-functions";

export type AlternativeHypothesis = "two-sided" | "greater" | "less";

export interface SampleSizeForProportionsOptions {
  baselineRate: number;
  minimumDetectableEffect: number;
  alpha: number;
  power: number;
  alternative?: AlternativeHypothesis;
}

export interface SampleSizeForProportionsResult {
  samplesPerVariant: number;
  totalSamples: number;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number`);
  }
}

function assertOpenUnitInterval(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0 || value >= 1) {
    throw new RangeError(`${name} must be in (0, 1)`);
  }
}

function resolveAlternative(alternative: AlternativeHypothesis): AlternativeHypothesis {
  if (
    alternative === "two-sided" ||
    alternative === "greater" ||
    alternative === "less"
  ) {
    return alternative;
  }

  throw new RangeError(
    'alternative must be one of "two-sided", "greater", or "less"'
  );
}

function resolveZAlpha(alpha: number, alternative: AlternativeHypothesis): number {
  if (alternative === "two-sided") {
    return normalPpf(1 - alpha / 2);
  }

  return normalPpf(1 - alpha);
}

/**
 * Sample-size planner for two-proportion experiments with equal allocation.
 *
 * Formula:
 * n = (z_alpha + z_beta)^2 * [p1(1-p1) + p2(1-p2)] / (p1 - p2)^2
 */
export function sampleSizeForProportions(
  options: SampleSizeForProportionsOptions
): SampleSizeForProportionsResult {
  const {
    baselineRate,
    minimumDetectableEffect,
    alpha,
    power,
    alternative = "two-sided",
  } = options;

  assertOpenUnitInterval(baselineRate, "baselineRate");
  assertFinite(minimumDetectableEffect, "minimumDetectableEffect");
  assertOpenUnitInterval(alpha, "alpha");
  assertOpenUnitInterval(power, "power");

  if (minimumDetectableEffect <= 0) {
    throw new RangeError("minimumDetectableEffect must be > 0");
  }

  const resolvedAlternative = resolveAlternative(alternative);
  const treatmentRate = baselineRate + minimumDetectableEffect;

  if (treatmentRate <= 0 || treatmentRate >= 1) {
    throw new RangeError(
      "baselineRate + minimumDetectableEffect must stay within (0, 1)"
    );
  }

  const delta = treatmentRate - baselineRate;
  const zAlpha = resolveZAlpha(alpha, resolvedAlternative);
  const zBeta = normalPpf(power);
  const pooledVariance =
    baselineRate * (1 - baselineRate) + treatmentRate * (1 - treatmentRate);

  const n = ((zAlpha + zBeta) ** 2 * pooledVariance) / (delta * delta);
  const samplesPerVariant = Math.ceil(n);

  if (!Number.isFinite(samplesPerVariant) || samplesPerVariant <= 0) {
    throw new RangeError("calculated sample size is not finite");
  }

  return {
    samplesPerVariant,
    totalSamples: samplesPerVariant * 2,
  };
}
