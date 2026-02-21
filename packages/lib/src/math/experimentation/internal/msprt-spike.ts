import { SeededRandom } from "../../random/index.js";

const DEFAULT_ALPHA = 0.05;
const DEFAULT_TAU = 0.1;
const DEFAULT_MAX_PAIRS = 5_000;
const DEFAULT_SEED = 42;
const MAX_EXP_INPUT = 709;

export interface MsprtSpikeEValueOptions {
  controlSuccesses: number;
  controlTotal: number;
  treatmentSuccesses: number;
  treatmentTotal: number;
  tau?: number;
}

export interface MsprtSpikeEValueResult {
  transformedEffect: number;
  sigmaSquared: number;
  logEValue: number;
  eValue: number;
}

export interface MsprtSpikeExperimentOptions {
  controlRate: number;
  treatmentRate: number;
  alpha?: number;
  maxPairs?: number;
  tau?: number;
  seed?: number;
  rng?: SeededRandom;
}

export interface MsprtSpikeExperimentResult {
  rejected: boolean;
  stoppingLook: number;
  controlSuccesses: number;
  treatmentSuccesses: number;
  maxLogEValue: number;
  finalEValue: number;
  finalPValue: number;
}

export interface MsprtSpikeNullSimulationOptions {
  nullRate: number;
  runs?: number;
  alpha?: number;
  maxPairs?: number;
  tau?: number;
  seed?: number;
}

export interface MsprtSpikeNullSimulationResult {
  nullRate: number;
  runs: number;
  rejections: number;
  empiricalType1: number;
  alpha: number;
  maxPairs: number;
  tau: number;
}

function assertFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be finite`);
  }
}

function assertNonNegativeInteger(value: number, name: string): void {
  assertFinite(value, name);
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative integer`);
  }
}

function assertPositiveInteger(value: number, name: string): void {
  assertFinite(value, name);
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

function assertOpenUnit(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0 || value >= 1) {
    throw new RangeError(`${name} must be in (0, 1)`);
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

function stableExp(exponent: number): number {
  if (exponent >= MAX_EXP_INPUT) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.exp(exponent);
}

function toProbabilityFromNegLog(negLogProbability: number): number {
  if (negLogProbability <= 0) {
    return 1;
  }
  if (negLogProbability >= MAX_EXP_INPUT) {
    return 0;
  }
  return Math.exp(-negLogProbability);
}

function resolveRng(options: MsprtSpikeExperimentOptions): SeededRandom {
  if (options.seed !== undefined && options.rng !== undefined) {
    throw new RangeError("Provide either seed or rng, not both");
  }
  if (options.seed !== undefined) {
    assertFinite(options.seed, "seed");
  }
  return options.rng ?? new SeededRandom(options.seed ?? DEFAULT_SEED);
}

export function msprtSpikeEValue(
  options: MsprtSpikeEValueOptions
): MsprtSpikeEValueResult {
  const {
    controlSuccesses,
    controlTotal,
    treatmentSuccesses,
    treatmentTotal,
    tau = DEFAULT_TAU,
  } = options;

  assertNonNegativeInteger(controlSuccesses, "controlSuccesses");
  assertNonNegativeInteger(treatmentSuccesses, "treatmentSuccesses");
  assertPositiveInteger(controlTotal, "controlTotal");
  assertPositiveInteger(treatmentTotal, "treatmentTotal");
  assertPositive(tau, "tau");

  if (controlTotal !== treatmentTotal) {
    throw new RangeError("controlTotal and treatmentTotal must match for paired looks");
  }
  if (controlSuccesses > controlTotal) {
    throw new RangeError("controlSuccesses must be <= controlTotal");
  }
  if (treatmentSuccesses > treatmentTotal) {
    throw new RangeError("treatmentSuccesses must be <= treatmentTotal");
  }

  const n = controlTotal;
  const pControl = (controlSuccesses + 0.5) / (n + 1);
  const pTreatment = (treatmentSuccesses + 0.5) / (n + 1);
  const transformedEffect =
    2 * Math.asin(Math.sqrt(pTreatment)) - 2 * Math.asin(Math.sqrt(pControl));
  const sigmaSquared = 2 / n;
  const tauSquared = tau * tau;
  const denominator = sigmaSquared + tauSquared;
  const logEValue =
    0.5 * (Math.log(sigmaSquared) - Math.log(denominator)) +
    (transformedEffect * transformedEffect * tauSquared) /
      (2 * sigmaSquared * denominator);

  return {
    transformedEffect,
    sigmaSquared,
    logEValue,
    eValue: stableExp(logEValue),
  };
}

export function runMsprtSpikeExperiment(
  options: MsprtSpikeExperimentOptions
): MsprtSpikeExperimentResult {
  const {
    controlRate,
    treatmentRate,
    alpha = DEFAULT_ALPHA,
    maxPairs = DEFAULT_MAX_PAIRS,
    tau = DEFAULT_TAU,
  } = options;
  const rng = resolveRng(options);

  assertClosedUnit(controlRate, "controlRate");
  assertClosedUnit(treatmentRate, "treatmentRate");
  assertOpenUnit(alpha, "alpha");
  assertPositiveInteger(maxPairs, "maxPairs");
  assertPositive(tau, "tau");

  const threshold = -Math.log(alpha);
  let controlSuccesses = 0;
  let treatmentSuccesses = 0;
  let maxLogEValue = Number.NEGATIVE_INFINITY;

  for (let look = 1; look <= maxPairs; look++) {
    if (rng.next() < controlRate) {
      controlSuccesses++;
    }
    if (rng.next() < treatmentRate) {
      treatmentSuccesses++;
    }

    const lookResult = msprtSpikeEValue({
      controlSuccesses,
      controlTotal: look,
      treatmentSuccesses,
      treatmentTotal: look,
      tau,
    });
    maxLogEValue = Math.max(maxLogEValue, lookResult.logEValue);

    if (maxLogEValue >= threshold) {
      return {
        rejected: true,
        stoppingLook: look,
        controlSuccesses,
        treatmentSuccesses,
        maxLogEValue,
        finalEValue: stableExp(maxLogEValue),
        finalPValue: toProbabilityFromNegLog(maxLogEValue),
      };
    }
  }

  return {
    rejected: false,
    stoppingLook: maxPairs,
    controlSuccesses,
    treatmentSuccesses,
    maxLogEValue,
    finalEValue: stableExp(maxLogEValue),
    finalPValue: toProbabilityFromNegLog(maxLogEValue),
  };
}

export function simulateMsprtSpikeNullType1(
  options: MsprtSpikeNullSimulationOptions
): MsprtSpikeNullSimulationResult {
  const {
    nullRate,
    runs = 10_000,
    alpha = DEFAULT_ALPHA,
    maxPairs = DEFAULT_MAX_PAIRS,
    tau = DEFAULT_TAU,
    seed = DEFAULT_SEED,
  } = options;

  assertClosedUnit(nullRate, "nullRate");
  assertPositiveInteger(runs, "runs");
  assertOpenUnit(alpha, "alpha");
  assertPositiveInteger(maxPairs, "maxPairs");
  assertPositive(tau, "tau");
  assertFinite(seed, "seed");

  const rng = new SeededRandom(seed);
  let rejections = 0;

  for (let run = 0; run < runs; run++) {
    const result = runMsprtSpikeExperiment({
      controlRate: nullRate,
      treatmentRate: nullRate,
      alpha,
      maxPairs,
      tau,
      rng,
    });
    if (result.rejected) {
      rejections++;
    }
  }

  return {
    nullRate,
    runs,
    rejections,
    empiricalType1: rejections / runs,
    alpha,
    maxPairs,
    tau,
  };
}
