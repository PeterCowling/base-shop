import { normalCdf, normalPpf } from "./internal/special-functions";
import type { AlternativeHypothesis } from "./sample-size";

export interface GroupSequentialTestOptions {
  informationFractions: readonly number[];
  alpha?: number;
  observedZ: number;
  alternative?: AlternativeHypothesis;
}

export interface GroupSequentialTestResult {
  stopEarly: boolean;
  lookIndex: number;
  criticalValues: number[];
  adjustedPValueApprox: number;
  method: string;
  alternative: AlternativeHypothesis;
}

const DEFAULT_ALPHA = 0.05;
const DEFAULT_ALTERNATIVE: AlternativeHypothesis = "two-sided";
const OBRIEN_FLEMING_METHOD =
  "O'Brien-Fleming approximation (z_k ~= z_(1-alpha/2) / sqrt(t_k)); approximate only, not gsDesign-equivalent";

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

function assertInformationFractions(informationFractions: readonly number[]): void {
  if (informationFractions.length === 0) {
    throw new RangeError("informationFractions must contain at least one look");
  }

  let previous = 0;
  for (let i = 0; i < informationFractions.length; i++) {
    const value = informationFractions[i];
    assertFinite(value, `informationFractions[${i}]`);
    if (value <= 0 || value > 1) {
      throw new RangeError(`informationFractions[${i}] must be in (0, 1]`);
    }
    if (value <= previous) {
      throw new RangeError("informationFractions must be strictly increasing");
    }
    previous = value;
  }
}

function assertAlternative(alternative: AlternativeHypothesis): void {
  if (
    alternative !== "two-sided" &&
    alternative !== "greater" &&
    alternative !== "less"
  ) {
    throw new RangeError("alternative must be one of: two-sided, greater, less");
  }
}

function computeBaseCritical(alpha: number, alternative: AlternativeHypothesis): number {
  const tailProbability = alternative === "two-sided" ? 1 - alpha / 2 : 1 - alpha;
  return normalPpf(tailProbability);
}

function computeCriticalValues(
  informationFractions: readonly number[],
  baseCritical: number
): number[] {
  return informationFractions.map((fraction) => baseCritical / Math.sqrt(fraction));
}

function approximateAdjustedPValue(
  observedZ: number,
  currentInformationFraction: number,
  alternative: AlternativeHypothesis
): number {
  const adjustedZ = observedZ * Math.sqrt(currentInformationFraction);
  if (alternative === "greater") {
    return 1 - normalCdf(adjustedZ);
  }
  if (alternative === "less") {
    return normalCdf(adjustedZ);
  }
  return Math.min(1, Math.max(0, 2 * (1 - normalCdf(Math.abs(adjustedZ)))));
}

function evaluateStopDecision(
  observedZ: number,
  currentCritical: number,
  alternative: AlternativeHypothesis
): boolean {
  if (alternative === "greater") {
    return observedZ >= currentCritical;
  }
  if (alternative === "less") {
    return observedZ <= -currentCritical;
  }
  return Math.abs(observedZ) >= currentCritical;
}

/**
 * Group-sequential boundary check using a classical O'Brien-Fleming approximation.
 *
 * Approximation contract:
 * z_k ~= z_(1-alpha/2) / sqrt(t_k) for two-sided tests
 * z_k ~= z_(1-alpha) / sqrt(t_k) for one-sided tests
 *
 * This is intentionally lightweight and not a replacement for full spending-function
 * implementations (for example, gsDesign).
 */
export function groupSequentialTest(
  options: GroupSequentialTestOptions
): GroupSequentialTestResult {
  const {
    informationFractions,
    alpha = DEFAULT_ALPHA,
    observedZ,
    alternative = DEFAULT_ALTERNATIVE,
  } = options;

  assertInformationFractions(informationFractions);
  assertOpenUnitInterval(alpha, "alpha");
  assertFinite(observedZ, "observedZ");
  assertAlternative(alternative);

  const baseCritical = computeBaseCritical(alpha, alternative);
  const criticalValues = computeCriticalValues(informationFractions, baseCritical);
  const lookIndex = informationFractions.length;
  const currentCritical = criticalValues[lookIndex - 1];
  const stopEarly = evaluateStopDecision(observedZ, currentCritical, alternative);
  const adjustedPValueApprox = approximateAdjustedPValue(
    observedZ,
    informationFractions[lookIndex - 1],
    alternative
  );

  return {
    stopEarly,
    lookIndex,
    criticalValues,
    adjustedPValueApprox,
    method: OBRIEN_FLEMING_METHOD,
    alternative,
  };
}
