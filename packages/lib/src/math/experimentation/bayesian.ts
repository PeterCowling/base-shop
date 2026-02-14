import { normalSample, SeededRandom } from "../random/index.js";

import { regularizedIncompleteBeta } from "./internal/special-functions.js";

export interface BetaPosteriorSummary {
  alpha: number;
  beta: number;
  mean: number;
  credibleInterval: {
    estimate: number;
    lower: number;
    upper: number;
    halfWidth: number;
  };
}

export interface BayesianABTestOptions {
  controlSuccesses: number;
  controlTotal: number;
  treatmentSuccesses: number;
  treatmentTotal: number;
  priorAlpha?: number;
  priorBeta?: number;
  credibleIntervalLevel?: number;
  simulationSamples?: number;
  seed?: number;
}

export interface BayesianABTestResult {
  controlPosterior: BetaPosteriorSummary;
  treatmentPosterior: BetaPosteriorSummary;
  probabilityTreatmentBetter: number;
  expectedLift: number;
}

const DEFAULT_PRIOR_ALPHA = 0.5;
const DEFAULT_PRIOR_BETA = 0.5;
const DEFAULT_CREDIBLE_LEVEL = 0.95;
const DEFAULT_SIMULATION_SAMPLES = 25_000;
const QUANTILE_TOLERANCE = 1e-10;
const QUANTILE_ITERATIONS = 120;

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

function assertPositive(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0) {
    throw new RangeError(`${name} must be > 0`);
  }
}

function assertOpenUnitInterval(value: number, name: string): void {
  assertFinite(value, name);
  if (value <= 0 || value >= 1) {
    throw new RangeError(`${name} must be in (0, 1)`);
  }
}

function betaQuantile(probability: number, alpha: number, beta: number): number {
  if (probability <= 0) {
    return 0;
  }
  if (probability >= 1) {
    return 1;
  }

  let low = 0;
  let high = 1;

  for (let i = 0; i < QUANTILE_ITERATIONS; i++) {
    const mid = (low + high) / 2;
    const cdf = regularizedIncompleteBeta(mid, alpha, beta);

    if (Math.abs(cdf - probability) <= QUANTILE_TOLERANCE) {
      return mid;
    }

    if (cdf < probability) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return (low + high) / 2;
}

function sampleGamma(shape: number, rng: SeededRandom): number {
  if (shape <= 0) {
    throw new RangeError("Gamma shape must be > 0");
  }

  if (shape < 1) {
    // Boosting method: Gamma(a) = Gamma(a+1) * U^(1/a), for a < 1.
    const boosted = sampleGamma(shape + 1, rng);
    const u = Math.max(rng.next(), Number.EPSILON);
    return boosted * Math.pow(u, 1 / shape);
  }

  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);

  while (true) {
    const x = normalSample(0, 1, () => rng.next());
    const vBase = 1 + c * x;

    if (vBase <= 0) {
      continue;
    }

    const v = vBase * vBase * vBase;
    const u = rng.next();
    const x2 = x * x;

    if (u < 1 - 0.0331 * x2 * x2) {
      return d * v;
    }

    if (Math.log(Math.max(u, Number.EPSILON)) < 0.5 * x2 + d * (1 - v + Math.log(v))) {
      return d * v;
    }
  }
}

function sampleBeta(alpha: number, beta: number, rng: SeededRandom): number {
  const x = sampleGamma(alpha, rng);
  const y = sampleGamma(beta, rng);
  return x / (x + y);
}

function summarizePosterior(
  alpha: number,
  beta: number,
  credibleIntervalLevel: number
): BetaPosteriorSummary {
  const lowerProb = (1 - credibleIntervalLevel) / 2;
  const upperProb = 1 - lowerProb;
  const lower = betaQuantile(lowerProb, alpha, beta);
  const upper = betaQuantile(upperProb, alpha, beta);
  const mean = alpha / (alpha + beta);

  return {
    alpha,
    beta,
    mean,
    credibleInterval: {
      estimate: mean,
      lower,
      upper,
      halfWidth: (upper - lower) / 2,
    },
  };
}

export function bayesianABTest(
  options: BayesianABTestOptions
): BayesianABTestResult {
  const {
    controlSuccesses,
    controlTotal,
    treatmentSuccesses,
    treatmentTotal,
    priorAlpha = DEFAULT_PRIOR_ALPHA,
    priorBeta = DEFAULT_PRIOR_BETA,
    credibleIntervalLevel = DEFAULT_CREDIBLE_LEVEL,
    simulationSamples = DEFAULT_SIMULATION_SAMPLES,
    seed = 42,
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

  assertPositive(priorAlpha, "priorAlpha");
  assertPositive(priorBeta, "priorBeta");
  assertOpenUnitInterval(credibleIntervalLevel, "credibleIntervalLevel");
  assertPositiveInteger(simulationSamples, "simulationSamples");
  assertFinite(seed, "seed");

  const controlFailures = controlTotal - controlSuccesses;
  const treatmentFailures = treatmentTotal - treatmentSuccesses;

  const controlAlpha = priorAlpha + controlSuccesses;
  const controlBeta = priorBeta + controlFailures;
  const treatmentAlpha = priorAlpha + treatmentSuccesses;
  const treatmentBeta = priorBeta + treatmentFailures;

  const controlPosterior = summarizePosterior(
    controlAlpha,
    controlBeta,
    credibleIntervalLevel
  );
  const treatmentPosterior = summarizePosterior(
    treatmentAlpha,
    treatmentBeta,
    credibleIntervalLevel
  );

  const rng = new SeededRandom(seed);
  let treatmentBetterCount = 0;
  let liftAccumulator = 0;

  for (let i = 0; i < simulationSamples; i++) {
    const controlSample = sampleBeta(controlAlpha, controlBeta, rng);
    const treatmentSample = sampleBeta(treatmentAlpha, treatmentBeta, rng);

    if (treatmentSample > controlSample) {
      treatmentBetterCount++;
    }

    liftAccumulator += (treatmentSample - controlSample) / controlSample;
  }

  return {
    controlPosterior,
    treatmentPosterior,
    probabilityTreatmentBetter: treatmentBetterCount / simulationSamples,
    expectedLift: liftAccumulator / simulationSamples,
  };
}
