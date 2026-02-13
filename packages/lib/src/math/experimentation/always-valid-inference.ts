import { SeededRandom } from "../random";

import {
  msprtSpikeEValue,
  runMsprtSpikeExperiment,
  simulateMsprtSpikeNullType1,
} from "./internal/msprt-spike";
import type { AlternativeHypothesis } from "./sample-size";

const DEFAULT_ALPHA = 0.05;
const DEFAULT_TAU = 0.1;
const DEFAULT_RUNS = 2_000;
const DEFAULT_MAX_PAIRS = 5_000;

const METHOD =
  "Gaussian-mixture mSPRT on arcsine-sqrt transformed Bernoulli effect (approximate CLT, two-sided only)";

const ASSUMPTIONS = [
  "IID Bernoulli outcomes within each stream",
  "Balanced paired looks (controlTotal == treatmentTotal)",
  "CLT approximation on variance-stabilized scale",
  "Two-sided alternative only in v1",
] as const;

export interface AlwaysValidMixturePrior {
  tau?: number;
}

export interface AlwaysValidPValueOptions {
  controlSuccesses: number;
  controlTotal: number;
  treatmentSuccesses: number;
  treatmentTotal: number;
  alpha?: number;
  alternative?: AlternativeHypothesis;
  mixturePrior?: AlwaysValidMixturePrior;
  previousMaxLogEValue?: number;
}

export interface AlwaysValidPValueResult {
  pValue: number;
  eValue: number;
  canStop: boolean;
  method: string;
  assumptions: readonly string[];
  maxLogEValue: number;
  currentLogEValue: number;
  transformedEffect: number;
}

export interface AlwaysValidType1SimulationOptions {
  nullRate: number;
  runs?: number;
  alpha?: number;
  maxPairs?: number;
  mixturePrior?: AlwaysValidMixturePrior;
  seed?: number;
}

export interface AlwaysValidType1SimulationResult {
  nullRate: number;
  runs: number;
  rejections: number;
  empiricalType1: number;
  alpha: number;
  maxPairs: number;
  tau: number;
}

export interface AlwaysValidPowerSimulationOptions {
  controlRate: number;
  treatmentRate: number;
  runs?: number;
  alpha?: number;
  maxPairs?: number;
  mixturePrior?: AlwaysValidMixturePrior;
  seed?: number;
}

export interface AlwaysValidPowerSimulationResult {
  runs: number;
  rejections: number;
  power: number;
  averageStoppingLook: number;
  averageStoppingLookWhenRejected: number;
  alpha: number;
  maxPairs: number;
  tau: number;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
}

function assertFiniteOrNegativeInfinity(value: number, name: string): void {
  if (value === Number.NEGATIVE_INFINITY) {
    return;
  }
  assertFinite(value, name);
}

function assertOpenUnit(value: number, name: string): void {
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

function assertClosedUnit(value: number, name: string): void {
  assertFinite(value, name);
  if (value < 0 || value > 1) {
    throw new RangeError(`${name} must be in [0, 1]`);
  }
}

function assertPositive(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0) {
    throw new RangeError(`${name} must be > 0`);
  }
}

function stableExp(logValue: number): number {
  if (logValue >= 709) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.exp(logValue);
}

function toPValueFromLogEvidence(logEvidence: number): number {
  if (logEvidence <= 0) {
    return 1;
  }
  if (logEvidence >= 709) {
    return 0;
  }
  return Math.exp(-logEvidence);
}

function resolveTau(mixturePrior?: AlwaysValidMixturePrior): number {
  const tau = mixturePrior?.tau ?? DEFAULT_TAU;
  assertPositive(tau, "mixturePrior.tau");
  return tau;
}

function assertTwoSidedOnly(alternative: AlternativeHypothesis): void {
  if (alternative !== "two-sided") {
    throw new RangeError(
      "alwaysValidPValue currently supports alternative='two-sided' only"
    );
  }
}

export function alwaysValidPValue(
  options: AlwaysValidPValueOptions
): AlwaysValidPValueResult {
  const {
    controlSuccesses,
    controlTotal,
    treatmentSuccesses,
    treatmentTotal,
    alpha = DEFAULT_ALPHA,
    alternative = "two-sided",
    previousMaxLogEValue = Number.NEGATIVE_INFINITY,
  } = options;
  const tau = resolveTau(options.mixturePrior);

  assertOpenUnit(alpha, "alpha");
  assertTwoSidedOnly(alternative);
  assertFiniteOrNegativeInfinity(previousMaxLogEValue, "previousMaxLogEValue");

  const lookEvidence = msprtSpikeEValue({
    controlSuccesses,
    controlTotal,
    treatmentSuccesses,
    treatmentTotal,
    tau,
  });
  const maxLogEValue = Math.max(previousMaxLogEValue, lookEvidence.logEValue);
  const eValue = stableExp(maxLogEValue);
  const pValue = toPValueFromLogEvidence(maxLogEValue);

  return {
    pValue,
    eValue,
    canStop: pValue <= alpha,
    method: METHOD,
    assumptions: ASSUMPTIONS,
    maxLogEValue,
    currentLogEValue: lookEvidence.logEValue,
    transformedEffect: lookEvidence.transformedEffect,
  };
}

export function simulateAlwaysValidType1(
  options: AlwaysValidType1SimulationOptions
): AlwaysValidType1SimulationResult {
  const {
    nullRate,
    runs = 10_000,
    alpha = DEFAULT_ALPHA,
    maxPairs = DEFAULT_MAX_PAIRS,
    seed = 42,
  } = options;
  const tau = resolveTau(options.mixturePrior);

  assertClosedUnit(nullRate, "nullRate");
  assertPositiveInteger(runs, "runs");
  assertOpenUnit(alpha, "alpha");
  assertPositiveInteger(maxPairs, "maxPairs");
  assertFinite(seed, "seed");

  return simulateMsprtSpikeNullType1({
    nullRate,
    runs,
    alpha,
    maxPairs,
    tau,
    seed,
  });
}

export function simulateAlwaysValidPower(
  options: AlwaysValidPowerSimulationOptions
): AlwaysValidPowerSimulationResult {
  const {
    controlRate,
    treatmentRate,
    runs = DEFAULT_RUNS,
    alpha = DEFAULT_ALPHA,
    maxPairs = DEFAULT_MAX_PAIRS,
    seed = 42,
  } = options;
  const tau = resolveTau(options.mixturePrior);

  assertClosedUnit(controlRate, "controlRate");
  assertClosedUnit(treatmentRate, "treatmentRate");
  assertPositiveInteger(runs, "runs");
  assertOpenUnit(alpha, "alpha");
  assertPositiveInteger(maxPairs, "maxPairs");
  assertFinite(seed, "seed");

  const rng = new SeededRandom(seed);
  let rejections = 0;
  let stoppingLookSum = 0;
  let stoppingLookRejectedSum = 0;

  for (let run = 0; run < runs; run++) {
    const result = runMsprtSpikeExperiment({
      controlRate,
      treatmentRate,
      alpha,
      maxPairs,
      tau,
      rng,
    });
    stoppingLookSum += result.stoppingLook;
    if (result.rejected) {
      rejections++;
      stoppingLookRejectedSum += result.stoppingLook;
    }
  }

  return {
    runs,
    rejections,
    power: rejections / runs,
    averageStoppingLook: stoppingLookSum / runs,
    averageStoppingLookWhenRejected:
      rejections > 0 ? stoppingLookRejectedSum / rejections : maxPairs,
    alpha,
    maxPairs,
    tau,
  };
}
